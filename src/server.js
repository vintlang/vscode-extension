const {
    createConnection,
    TextDocuments,
    DiagnosticSeverity,
    ProposedFeatures,
    DidChangeConfigurationNotification,
    CompletionItemKind,
    TextDocumentSyncKind,
    SymbolKind,
    FoldingRangeKind,
    SemanticTokensBuilder,
    SemanticTokenTypes,
    SemanticTokenModifiers,
} = require('vscode-languageserver/node');

const { TextDocument } = require('vscode-languageserver-textdocument');

// Create a connection for the server, using Node's IPC as a transport.
const connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager.
const documents = new TextDocuments(TextDocument);

let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;

// Symbol table for tracking variables and functions across the document
class SymbolTable {
    constructor() {
        this.symbols = new Map(); // name -> { type, line, scope, references }
    }

    addSymbol(name, type, line, scope = 'global') {
        if (!this.symbols.has(name)) {
            this.symbols.set(name, {
                type,
                line,
                scope,
                references: [],
                used: false,
            });
        }
    }

    addReference(name, line) {
        const symbol = this.symbols.get(name);
        if (symbol) {
            symbol.references.push(line);
            symbol.used = true;
        }
    }

    getSymbol(name) {
        return this.symbols.get(name);
    }

    clear() {
        this.symbols.clear();
    }

    getUnusedSymbols() {
        const unused = [];
        for (const [name, symbol] of this.symbols.entries()) {
            if (!symbol.used && symbol.type !== 'import') {
                unused.push({ name, ...symbol });
            }
        }
        return unused;
    }
}

// Document-specific symbol tables
const documentSymbols = new Map();

// Semantic token legend
const tokenTypes = [
    SemanticTokenTypes.namespace, // 0 - modules
    SemanticTokenTypes.type, // 1 - types
    SemanticTokenTypes.class, // 2 - classes
    SemanticTokenTypes.enum, // 3 - enums
    SemanticTokenTypes.interface, // 4 - interfaces
    SemanticTokenTypes.struct, // 5 - structs
    SemanticTokenTypes.typeParameter, // 6 - type parameters
    SemanticTokenTypes.parameter, // 7 - parameters
    SemanticTokenTypes.variable, // 8 - variables
    SemanticTokenTypes.property, // 9 - properties
    SemanticTokenTypes.enumMember, // 10 - enum members
    SemanticTokenTypes.event, // 11 - events
    SemanticTokenTypes.function, // 12 - functions
    SemanticTokenTypes.method, // 13 - methods
    SemanticTokenTypes.macro, // 14 - macros
    SemanticTokenTypes.keyword, // 15 - keywords
    SemanticTokenTypes.modifier, // 16 - modifiers
    SemanticTokenTypes.comment, // 17 - comments
    SemanticTokenTypes.string, // 18 - strings
    SemanticTokenTypes.number, // 19 - numbers
    SemanticTokenTypes.regexp, // 20 - regular expressions
    SemanticTokenTypes.operator, // 21 - operators
];

const tokenModifiers = [
    SemanticTokenModifiers.declaration, // 0
    SemanticTokenModifiers.definition, // 1
    SemanticTokenModifiers.readonly, // 2
    SemanticTokenModifiers.static, // 3
    SemanticTokenModifiers.deprecated, // 4
    SemanticTokenModifiers.abstract, // 5
    SemanticTokenModifiers.async, // 6
    SemanticTokenModifiers.modification, // 7
    SemanticTokenModifiers.documentation, // 8
    SemanticTokenModifiers.defaultLibrary, // 9
];

// VintLang language configuration
const vintlangConfig = {
    keywords: [
        'if',
        'else',
        'elif',
        'while',
        'for',
        'in',
        'switch',
        'case',
        'default',
        'break',
        'continue',
        'func',
        'return',
        'let',
        'declare',
        'defer',
        'import',
        'package',
        'include',
        'true',
        'false',
        'null',
        'try',
        'catch',
        'throw',
        'finally',
    ],
    builtins: [
        'print',
        'println',
        'write',
        'type',
        'convert',
        'has_key',
        'len',
        'range',
        'split',
        'join',
        'replace',
        'contains',
        'startsWith',
        'endsWith',
        'trim',
        'upper',
        'lower',
        'push',
        'pop',
        'shift',
        'unshift',
        'slice',
        'splice',
        'sort',
        'reverse',
        'abs',
        'ceil',
        'floor',
        'round',
        'max',
        'min',
        'sqrt',
        'pow',
        'random',
        'now',
        'format',
        'add',
        'subtract',
        'isLeapYear',
        'exec',
        'env',
        'args',
        'exit',
        // File I/O functions
        'readFile',
        'writeFile',
        'appendFile',
        'deleteFile',
        'fileExists',
        'readDir',
        'makeDir',
        // Additional math functions
        'sin',
        'cos',
        'tan',
        'log',
        'exp',
        'toFixed',
        'parseInt',
        'parseFloat',
        // Utility functions
        'keys',
        'values',
        'entries',
        'merge',
        'clone',
        'freeze',
        'seal',
        // Additional string functions
        'substring',
        'indexOf',
        'lastIndexOf',
        'charAt',
        'charCodeAt',
        'padStart',
        'padEnd',
        'repeat',
        // Additional array functions
        'map',
        'filter',
        'reduce',
        'find',
        'findIndex',
        'includes',
        'forEach',
        // Type checking functions
        'isString',
        'isNumber',
        'isArray',
        'isMap',
        'isNull',
        'isBool',
        // Additional math functions
        'asin',
        'acos',
        'atan',
        'atan2',
        'cbrt',
    ],
    modules: ['time', 'net', 'os', 'json', 'csv', 'regex', 'crypto', 'encoding', 'colors', 'term'],
};

connection.onInitialize(params => {
    const capabilities = params.capabilities;

    // Does the client support the `workspace/configuration` request?
    hasConfigurationCapability = !!(
        capabilities.workspace && !!capabilities.workspace.configuration
    );
    hasWorkspaceFolderCapability = !!(
        capabilities.workspace && !!capabilities.workspace.workspaceFolders
    );
    // hasDiagnosticRelatedInformationCapability = !!(
    //     capabilities.textDocument &&
    //     capabilities.textDocument.publishDiagnostics &&
    //     capabilities.textDocument.publishDiagnostics.relatedInformation
    // );

    const result = {
        capabilities: {
            textDocumentSync: TextDocumentSyncKind.Incremental,
            // Tell the client that this server supports code completion.
            completionProvider: {
                resolveProvider: true,
                triggerCharacters: ['.', '(', '{', '['],
            },
            // Support hover information
            hoverProvider: true,
            // Support go to definition
            definitionProvider: true,
            // Support find references
            referencesProvider: true,
            // Support document symbols
            documentSymbolProvider: true,
            // Support workspace symbols
            workspaceSymbolProvider: true,
            // Support signature help
            signatureHelpProvider: {
                triggerCharacters: ['(', ','],
            },
            // Support document formatting
            documentFormattingProvider: true,
            // Support document range formatting
            documentRangeFormattingProvider: true,
            // Support rename
            renameProvider: {
                prepareProvider: true,
            },
            // Support code actions
            codeActionProvider: true,
            // Support folding ranges
            foldingRangeProvider: true,
            // Support document highlight
            documentHighlightProvider: true,
            // Support document links
            documentLinkProvider: {
                resolveProvider: false,
            },
            // Support selection ranges
            selectionRangeProvider: true,
            // Support semantic tokens
            semanticTokensProvider: {
                legend: {
                    tokenTypes: tokenTypes,
                    tokenModifiers: tokenModifiers,
                },
                full: true,
            },
            // Support inlay hints
            inlayHintProvider: true,
            // Support call hierarchy
            callHierarchyProvider: true,
            // Support code lens
            codeLensProvider: {
                resolveProvider: false,
            },
            // Support color provider
            colorProvider: true,
        },
    };

    if (hasWorkspaceFolderCapability) {
        result.capabilities.workspace = {
            workspaceFolders: {
                supported: true,
            },
        };
    }

    return result;
});

connection.onInitialized(() => {
    if (hasConfigurationCapability) {
        // Register for all configuration changes.
        connection.client.register(DidChangeConfigurationNotification.type, undefined);
    }
    if (hasWorkspaceFolderCapability) {
        connection.workspace.onDidChangeWorkspaceFolders(_event => {
            connection.console.log('Workspace folder change event received.');
        });
    }
});

// The global settings, used when the `workspace/configuration` request is not supported by the client.
const defaultSettings = { maxNumberOfProblems: 1000 };
let globalSettings = defaultSettings;

// Cache the settings of all open documents
const documentSettings = new Map();

connection.onDidChangeConfiguration(change => {
    if (hasConfigurationCapability) {
        // Reset all cached document settings
        documentSettings.clear();
    } else {
        globalSettings = change.settings.vintlang || defaultSettings;
    }

    // Revalidate all open text documents
    documents.all().forEach(validateTextDocument);
});

// function getDocumentSettings(resource) {
//     if (!hasConfigurationCapability) {
//         return Promise.resolve(globalSettings);
//     }
//     let result = documentSettings.get(resource);
//     if (!result) {
//         result = connection.workspace.getConfiguration({
//             scopeUri: resource,
//             section: 'vintlang',
//         });
//         documentSettings.set(resource, result);
//     }
//     return result;
// }

// Only keep settings for open documents
documents.onDidClose(e => {
    documentSettings.delete(e.document.uri);
});

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent(change => {
    validateTextDocument(change.document);
});

async function validateTextDocument(textDocument) {
    // const _settings = await getDocumentSettings(textDocument.uri);
    const text = textDocument.getText();
    const diagnostics = [];

    // Initialize symbol table for this document
    const symbolTable = new SymbolTable();
    documentSymbols.set(textDocument.uri, symbolTable);

    // Basic VintLang syntax validation
    const lines = text.split('\n');

    // First pass: collect symbol definitions
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Skip empty lines and comments
        if (!line || line.startsWith('//') || line.startsWith('/*')) {
            continue;
        }

        // Collect function definitions
        const funcMatch = line.match(/let\s+(\w+)\s*=\s*func/);
        if (funcMatch) {
            symbolTable.addSymbol(funcMatch[1], 'function', i);
        }

        // Collect variable declarations
        const varMatch = line.match(/let\s+(\w+)\s*=/);
        if (varMatch && !funcMatch) {
            symbolTable.addSymbol(varMatch[1], 'variable', i);
        }

        // Collect imports
        const importMatch = line.match(/import\s+(\w+)/);
        if (importMatch) {
            symbolTable.addSymbol(importMatch[1], 'import', i);
        }
    }

    // Second pass: check for references and validate syntax
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Skip empty lines and comments
        if (!line || line.startsWith('//') || line.startsWith('/*')) {
            continue;
        }

        // Track symbol usage
        const identifiers = line.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g);
        if (identifiers) {
            identifiers.forEach(id => {
                if (
                    !vintlangConfig.keywords.includes(id) &&
                    !vintlangConfig.builtins.includes(id)
                ) {
                    symbolTable.addReference(id, i);
                }
            });
        }

        // Check for common syntax errors
        validateLine(line, i, textDocument, diagnostics, symbolTable);
    }

    // Check for unused variables
    const unusedSymbols = symbolTable.getUnusedSymbols();
    for (const symbol of unusedSymbols) {
        const line = lines[symbol.line];
        diagnostics.push({
            severity: DiagnosticSeverity.Hint,
            range: {
                start: { line: symbol.line, character: 0 },
                end: { line: symbol.line, character: line.length },
            },
            message: `${symbol.type === 'function' ? 'Function' : 'Variable'} '${symbol.name}' is declared but never used`,
            source: 'vintlang',
            tags: [1], // Unnecessary tag
            code: 'unused-symbol',
        });
    }

    // Send the computed diagnostics to VSCode.
    connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}

function validateLine(line, lineNumber, document, diagnostics, symbolTable) {
    // Check for unmatched braces
    const openBraces = (line.match(/\{/g) || []).length;
    const closeBraces = (line.match(/\}/g) || []).length;

    // Check for unmatched parentheses
    const openParens = (line.match(/\(/g) || []).length;
    const closeParens = (line.match(/\)/g) || []).length;

    // Warn about unmatched braces on the same line
    if (openBraces !== closeBraces && (openBraces > 0 || closeBraces > 0)) {
        if (closeBraces > openBraces) {
            diagnostics.push({
                severity: DiagnosticSeverity.Error,
                range: {
                    start: { line: lineNumber, character: 0 },
                    end: { line: lineNumber, character: line.length },
                },
                message: 'Unmatched closing brace',
                source: 'vintlang',
                code: 'unmatched-brace',
            });
        }
    }

    // Warn about unmatched parentheses on the same line
    if (openParens !== closeParens && !line.includes('{')) {
        diagnostics.push({
            severity: DiagnosticSeverity.Warning,
            range: {
                start: { line: lineNumber, character: 0 },
                end: { line: lineNumber, character: line.length },
            },
            message: 'Unmatched parentheses',
            source: 'vintlang',
            code: 'unmatched-paren',
        });
    }

    // Check for function syntax
    if (line.includes('func') && !line.match(/let\s+\w+\s*=\s*func/)) {
        diagnostics.push({
            severity: DiagnosticSeverity.Error,
            range: {
                start: { line: lineNumber, character: 0 },
                end: { line: lineNumber, character: line.length },
            },
            message: `Function should be declared as 'let name = func(params) { ... }'`,
            source: 'vintlang',
            code: 'invalid-function-syntax',
        });
    }

    // Check for undefined variables (basic check)
    const varMatch = line.match(/^(\w+)\s*=\s*(.+)/);
    if (varMatch && !line.includes('let') && !vintlangConfig.keywords.includes(varMatch[1])) {
        const varName = varMatch[1];
        const symbol = symbolTable.getSymbol(varName);

        if (!symbol) {
            diagnostics.push({
                severity: DiagnosticSeverity.Warning,
                range: {
                    start: { line: lineNumber, character: 0 },
                    end: { line: lineNumber, character: varName.length },
                },
                message: `Consider using 'let' to declare variable '${varName}'`,
                source: 'vintlang',
                code: 'missing-let',
            });
        }
    }

    // Check for missing semicolons in certain contexts (optional style check)
    if (
        line.match(/^\s*\w+\(.*\)$/) &&
        !line.includes('if') &&
        !line.includes('while') &&
        !line.includes('for')
    ) {
        // This is a function call without assignment - could suggest adding semicolon
        // But VintLang might not require semicolons, so we'll skip this for now
    }
}

// This handler provides the initial list of the completion items.
connection.onCompletion(_textDocumentPosition => {
    const items = [];

    // Add keywords
    vintlangConfig.keywords.forEach((keyword, index) => {
        items.push({
            label: keyword,
            kind: CompletionItemKind.Keyword,
            data: index,
        });
    });

    // Add built-in functions
    vintlangConfig.builtins.forEach((builtin, index) => {
        items.push({
            label: builtin,
            kind: CompletionItemKind.Function,
            data: vintlangConfig.keywords.length + index,
            insertText: `${builtin}($1)`,
            insertTextFormat: 2, // Snippet format
        });
    });

    // Add modules
    vintlangConfig.modules.forEach((module, index) => {
        items.push({
            label: module,
            kind: CompletionItemKind.Module,
            data: vintlangConfig.keywords.length + vintlangConfig.builtins.length + index,
        });
    });

    return items;
});

// This handler resolves additional information for the item selected in
// the completion list.
connection.onCompletionResolve(item => {
    const data = item.data;

    if (data < vintlangConfig.keywords.length) {
        // It's a keyword
        item.detail = 'VintLang keyword';
        item.documentation = `The '${item.label}' keyword in VintLang`;
    } else if (data < vintlangConfig.keywords.length + vintlangConfig.builtins.length) {
        // It's a built-in function
        item.detail = 'VintLang built-in function';
        item.documentation = `Built-in function: ${item.label}()`;
    } else {
        // It's a module
        item.detail = 'VintLang module';
        item.documentation = `VintLang module: ${item.label}`;
    }

    return item;
});

// Hover provider
connection.onHover(params => {
    const document = documents.get(params.textDocument.uri);
    if (!document) {
        return null;
    }

    const position = params.position;
    const text = document.getText();
    const offset = document.offsetAt(position);

    // Get the word at the position
    const wordRange = getWordRangeAtPosition(text, offset);
    if (!wordRange) {
        return null;
    }

    const word = text.substring(wordRange.start, wordRange.end);
    const documentation = getHoverDocumentation(word);

    if (documentation) {
        return {
            contents: {
                kind: 'markdown',
                value: documentation,
            },
            range: {
                start: document.positionAt(wordRange.start),
                end: document.positionAt(wordRange.end),
            },
        };
    }

    return null;
});

function getWordRangeAtPosition(text, offset) {
    let start = offset;
    let end = offset;

    // Find word boundaries
    // const _wordPattern = /[a-zA-Z_][a-zA-Z0-9_]*/;

    // Go backwards to find the start
    while (start > 0 && /[a-zA-Z0-9_]/.test(text[start - 1])) {
        start--;
    }

    // Go forwards to find the end
    while (end < text.length && /[a-zA-Z0-9_]/.test(text[end])) {
        end++;
    }

    if (start === end) {
        return null;
    }

    return { start, end };
}

function getHoverDocumentation(word) {
    const docs = {
        print: '**print(value)** - Prints a value to the console\n\n```vint\nprint("Hello, World!")\n```',
        println:
            '**println(value)** - Prints a value to the console with a newline\n\n```vint\nprintln("Hello, World!")\n```',
        func: '**func** - Defines a function\n\n```vint\nlet myFunction = func(param1, param2) {\n    return param1 + param2\n}\n```',
        let: '**let** - Declares a variable\n\n```vint\nlet myVariable = "Hello"\nlet myNumber = 42\n```',
        if: '**if** - Conditional statement\n\n```vint\nif (condition) {\n    // code\n} else {\n    // alternative code\n}\n```',
        for: '**for** - Loop statement\n\n```vint\nfor item in collection {\n    print(item)\n}\n```',
        while: '**while** - Loop statement\n\n```vint\nwhile (condition) {\n    // code\n}\n```',
        import: '**import** - Imports a module\n\n```vint\nimport time\nimport net\n```',
        type: '**type(value)** - Returns the type of a value\n\n```vint\nlet t = type(42)  // "INTEGER"\n```',
        convert:
            '**convert(value, type)** - Converts a value to the specified type\n\n```vint\nlet str = "123"\nconvert(str, "INTEGER")\n```',
        len: '**len(collection)** - Returns the length of a string, array, or map\n\n```vint\nlet size = len([1, 2, 3])  // 3\n```',
        range: '**range(start, end, [step])** - Creates a range of numbers\n\n```vint\nfor i in range(0, 10) {\n    print(i)\n}\n```',
        split: '**split(string, delimiter)** - Splits a string by delimiter\n\n```vint\nlet parts = split("a,b,c", ",")\n```',
        join: '**join(array, separator)** - Joins array elements into a string\n\n```vint\nlet result = join(["a", "b", "c"], ",")\n```',
        time: '**time** - Module for time-related operations\n\nFunctions:\n- `now()` - Get current timestamp\n- `format(time, layout)` - Format time\n- `add(time, duration)` - Add duration to time\n- `subtract(time, duration)` - Subtract duration from time\n- `isLeapYear(year)` - Check if year is leap year',
        net: '**net** - Module for network operations\n\nFunctions:\n- `get(url)` - HTTP GET request\n- `post(url, data)` - HTTP POST request\n- `put(url, data)` - HTTP PUT request\n- `delete(url)` - HTTP DELETE request',
        json: '**json** - Module for JSON operations\n\nFunctions:\n- `parse(string)` - Parse JSON string\n- `stringify(value)` - Convert value to JSON string',
        os: '**os** - Module for operating system operations\n\nFunctions:\n- `exec(command)` - Execute shell command\n- `env(name)` - Get environment variable\n- `args()` - Get command line arguments\n- `exit(code)` - Exit program',
        defer: '**defer** - Defers execution until function returns\n\n```vint\nlet myFunc = func() {\n    defer println("This runs last")\n    println("This runs first")\n}\n```',
        // File I/O functions
        readFile:
            '**readFile(path)** - Reads the contents of a file\n\n```vint\nlet content = readFile("data.txt")\n```',
        writeFile:
            '**writeFile(path, content)** - Writes content to a file\n\n```vint\nwriteFile("output.txt", "Hello, World!")\n```',
        appendFile:
            '**appendFile(path, content)** - Appends content to a file\n\n```vint\nappendFile("log.txt", "New log entry\\n")\n```',
        deleteFile: '**deleteFile(path)** - Deletes a file\n\n```vint\ndeleteFile("temp.txt")\n```',
        fileExists:
            '**fileExists(path)** - Checks if a file exists\n\n```vint\nif (fileExists("config.json")) {\n    // file exists\n}\n```',
        readDir:
            '**readDir(path)** - Reads directory contents\n\n```vint\nlet files = readDir("./src")\n```',
        makeDir: '**makeDir(path)** - Creates a directory\n\n```vint\nmakeDir("output")\n```',
        // Additional math functions
        sin: '**sin(x)** - Calculates sine of x (in radians)\n\n```vint\nlet result = sin(3.14159)\n```',
        cos: '**cos(x)** - Calculates cosine of x (in radians)\n\n```vint\nlet result = cos(0)\n```',
        tan: '**tan(x)** - Calculates tangent of x (in radians)\n\n```vint\nlet result = tan(0.785398)\n```',
        log: '**log(x)** - Calculates natural logarithm of x\n\n```vint\nlet result = log(2.718281828)\n```',
        exp: '**exp(x)** - Calculates e raised to the power of x\n\n```vint\nlet result = exp(1)\n```',
        toFixed:
            '**toFixed(number, digits)** - Formats a number to fixed decimal places\n\n```vint\nlet formatted = toFixed(3.14159, 2)  // "3.14"\n```',
        parseInt:
            '**parseInt(string)** - Parses a string to an integer\n\n```vint\nlet num = parseInt("42")\n```',
        parseFloat:
            '**parseFloat(string)** - Parses a string to a float\n\n```vint\nlet num = parseFloat("3.14")\n```',
        // Utility functions
        keys: '**keys(map)** - Returns an array of map keys\n\n```vint\nlet m = {"a": 1, "b": 2}\nlet k = keys(m)  // ["a", "b"]\n```',
        values: '**values(map)** - Returns an array of map values\n\n```vint\nlet m = {"a": 1, "b": 2}\nlet v = values(m)  // [1, 2]\n```',
        entries:
            '**entries(map)** - Returns an array of [key, value] pairs\n\n```vint\nlet m = {"a": 1, "b": 2}\nlet e = entries(m)\n```',
        merge: '**merge(map1, map2)** - Merges two maps\n\n```vint\nlet result = merge({"a": 1}, {"b": 2})\n```',
        clone: '**clone(value)** - Creates a deep copy of a value\n\n```vint\nlet copy = clone(original)\n```',
        freeze: '**freeze(object)** - Freezes an object to prevent modifications\n\n```vint\nfreeze(myObject)\n```',
        seal: '**seal(object)** - Seals an object to prevent adding new properties\n\n```vint\nseal(myObject)\n```',
        // Additional string functions
        substring:
            '**substring(string, start, end)** - Extracts a portion of a string between two indices\n\n```vint\nlet text = "Hello World"\nlet part = substring(text, 0, 5)  // "Hello"\n```',
        indexOf:
            '**indexOf(string, searchValue)** - Returns the index of the first occurrence of a value in a string\n\n```vint\nlet text = "Hello World"\nlet index = indexOf(text, "World")  // 6\n```',
        lastIndexOf:
            '**lastIndexOf(string, searchValue)** - Returns the index of the last occurrence of a value in a string\n\n```vint\nlet text = "Hello World World"\nlet index = lastIndexOf(text, "World")  // 12\n```',
        charAt: '**charAt(string, index)** - Returns the character at the specified index\n\n```vint\nlet text = "Hello"\nlet char = charAt(text, 0)  // "H"\n```',
        charCodeAt:
            '**charCodeAt(string, index)** - Returns the Unicode value of the character at the specified index\n\n```vint\nlet text = "Hello"\nlet code = charCodeAt(text, 0)  // 72\n```',
        padStart:
            '**padStart(string, length, padString)** - Pads the string from the start to reach a target length\n\n```vint\nlet num = "5"\nlet padded = padStart(num, 3, "0")  // "005"\n```',
        padEnd: '**padEnd(string, length, padString)** - Pads the string from the end to reach a target length\n\n```vint\nlet text = "Hi"\nlet padded = padEnd(text, 5, "!")  // "Hi!!!"\n```',
        repeat: '**repeat(string, count)** - Returns a new string with the specified number of copies\n\n```vint\nlet text = "Ha"\nlet repeated = repeat(text, 3)  // "HaHaHa"\n```',
        // Additional array functions
        map: '**map(array, function)** - Creates a new array with the results of calling a function for every array element\n\n```vint\nlet numbers = [1, 2, 3]\nlet doubled = map(numbers, func(x) { return x * 2 })  // [2, 4, 6]\n```',
        filter: '**filter(array, function)** - Creates a new array with elements that pass the test function\n\n```vint\nlet numbers = [1, 2, 3, 4, 5]\nlet evens = filter(numbers, func(x) { return x % 2 == 0 })  // [2, 4]\n```',
        reduce: '**reduce(array, function, initialValue)** - Reduces the array to a single value by executing a function\n\n```vint\nlet numbers = [1, 2, 3, 4]\nlet sum = reduce(numbers, func(acc, x) { return acc + x }, 0)  // 10\n```',
        find: '**find(array, function)** - Returns the first element that satisfies the test function\n\n```vint\nlet numbers = [1, 2, 3, 4]\nlet found = find(numbers, func(x) { return x > 2 })  // 3\n```',
        findIndex:
            '**findIndex(array, function)** - Returns the index of the first element that satisfies the test function\n\n```vint\nlet numbers = [1, 2, 3, 4]\nlet index = findIndex(numbers, func(x) { return x > 2 })  // 2\n```',
        includes:
            '**includes(array, value)** - Checks if an array contains a specific value\n\n```vint\nlet fruits = ["apple", "banana", "orange"]\nlet hasApple = includes(fruits, "apple")  // true\n```',
        forEach:
            '**forEach(array, function)** - Executes a function for each array element\n\n```vint\nlet numbers = [1, 2, 3]\nforEach(numbers, func(x) { println(x) })\n```',
        // Type checking functions
        isString:
            '**isString(value)** - Checks if a value is a string\n\n```vint\nlet result = isString("hello")  // true\nlet result2 = isString(42)  // false\n```',
        isNumber:
            '**isNumber(value)** - Checks if a value is a number\n\n```vint\nlet result = isNumber(42)  // true\nlet result2 = isNumber("42")  // false\n```',
        isArray:
            '**isArray(value)** - Checks if a value is an array\n\n```vint\nlet result = isArray([1, 2, 3])  // true\nlet result2 = isArray("array")  // false\n```',
        isMap: '**isMap(value)** - Checks if a value is a map/object\n\n```vint\nlet result = isMap({"key": "value"})  // true\nlet result2 = isMap([1, 2])  // false\n```',
        isNull: '**isNull(value)** - Checks if a value is null\n\n```vint\nlet result = isNull(null)  // true\nlet result2 = isNull(0)  // false\n```',
        isBool: '**isBool(value)** - Checks if a value is a boolean\n\n```vint\nlet result = isBool(true)  // true\nlet result2 = isBool(1)  // false\n```',
        // Additional math functions
        asin: '**asin(x)** - Calculates arc sine (inverse sine) of x, returns value in radians\n\n```vint\nlet result = asin(0.5)  // ~0.524 radians (30 degrees)\n```',
        acos: '**acos(x)** - Calculates arc cosine (inverse cosine) of x, returns value in radians\n\n```vint\nlet result = acos(0.5)  // ~1.047 radians (60 degrees)\n```',
        atan: '**atan(x)** - Calculates arc tangent (inverse tangent) of x, returns value in radians\n\n```vint\nlet result = atan(1)  // ~0.785 radians (45 degrees)\n```',
        atan2: '**atan2(y, x)** - Calculates the angle between the positive x-axis and the point (x, y)\n\n```vint\nlet angle = atan2(1, 1)  // ~0.785 radians (45 degrees)\n```',
        cbrt: '**cbrt(x)** - Calculates the cube root of x\n\n```vint\nlet result = cbrt(27)  // 3\nlet result2 = cbrt(8)  // 2\n```',
    };

    return docs[word] || null;
}

// Signature help provider
connection.onSignatureHelp(params => {
    const document = documents.get(params.textDocument.uri);
    if (!document) {
        return null;
    }

    const position = params.position;
    const text = document.getText();
    const offset = document.offsetAt(position);

    // Find the function call we're in
    let lineStart = offset;
    while (lineStart > 0 && text[lineStart] !== '\n') {
        lineStart--;
    }

    const lineText = text.substring(lineStart, offset);
    const funcMatch = lineText.match(/(\w+)\s*\([^)]*$/);

    if (!funcMatch) {
        return null;
    }

    const funcName = funcMatch[1];

    // Define signatures for built-in functions
    const signatures = {
        print: {
            label: 'print(value)',
            documentation: 'Prints a value to the console',
            parameters: [{ label: 'value', documentation: 'The value to print' }],
        },
        println: {
            label: 'println(value)',
            documentation: 'Prints a value to the console with a newline',
            parameters: [{ label: 'value', documentation: 'The value to print' }],
        },
        type: {
            label: 'type(value)',
            documentation: 'Returns the type of a value',
            parameters: [{ label: 'value', documentation: 'The value to check' }],
        },
        convert: {
            label: 'convert(value, type)',
            documentation: 'Converts a value to the specified type',
            parameters: [
                { label: 'value', documentation: 'The value to convert' },
                { label: 'type', documentation: 'Target type (INTEGER, STRING, etc.)' },
            ],
        },
        len: {
            label: 'len(collection)',
            documentation: 'Returns the length of a collection',
            parameters: [{ label: 'collection', documentation: 'The collection to measure' }],
        },
        range: {
            label: 'range(start, end, [step])',
            documentation: 'Creates a range of numbers',
            parameters: [
                { label: 'start', documentation: 'Starting number' },
                { label: 'end', documentation: 'Ending number (exclusive)' },
                { label: 'step', documentation: 'Step size (optional, default: 1)' },
            ],
        },
        split: {
            label: 'split(string, delimiter)',
            documentation: 'Splits a string by delimiter',
            parameters: [
                { label: 'string', documentation: 'The string to split' },
                { label: 'delimiter', documentation: 'The delimiter to split by' },
            ],
        },
        join: {
            label: 'join(array, separator)',
            documentation: 'Joins array elements into a string',
            parameters: [
                { label: 'array', documentation: 'The array to join' },
                { label: 'separator', documentation: 'The separator to use' },
            ],
        },
        // File I/O signatures
        readFile: {
            label: 'readFile(path)',
            documentation: 'Reads the contents of a file',
            parameters: [{ label: 'path', documentation: 'Path to the file to read' }],
        },
        writeFile: {
            label: 'writeFile(path, content)',
            documentation: 'Writes content to a file',
            parameters: [
                { label: 'path', documentation: 'Path to the file' },
                { label: 'content', documentation: 'Content to write' },
            ],
        },
        appendFile: {
            label: 'appendFile(path, content)',
            documentation: 'Appends content to a file',
            parameters: [
                { label: 'path', documentation: 'Path to the file' },
                { label: 'content', documentation: 'Content to append' },
            ],
        },
        fileExists: {
            label: 'fileExists(path)',
            documentation: 'Checks if a file exists',
            parameters: [{ label: 'path', documentation: 'Path to check' }],
        },
        readDir: {
            label: 'readDir(path)',
            documentation: 'Reads directory contents',
            parameters: [{ label: 'path', documentation: 'Path to directory' }],
        },
        makeDir: {
            label: 'makeDir(path)',
            documentation: 'Creates a directory',
            parameters: [{ label: 'path', documentation: 'Path to create' }],
        },
        // Math function signatures
        toFixed: {
            label: 'toFixed(number, digits)',
            documentation: 'Formats a number to fixed decimal places',
            parameters: [
                { label: 'number', documentation: 'The number to format' },
                { label: 'digits', documentation: 'Number of decimal places' },
            ],
        },
        parseInt: {
            label: 'parseInt(string)',
            documentation: 'Parses a string to an integer',
            parameters: [{ label: 'string', documentation: 'The string to parse' }],
        },
        parseFloat: {
            label: 'parseFloat(string)',
            documentation: 'Parses a string to a float',
            parameters: [{ label: 'string', documentation: 'The string to parse' }],
        },
        // Utility function signatures
        merge: {
            label: 'merge(map1, map2)',
            documentation: 'Merges two maps',
            parameters: [
                { label: 'map1', documentation: 'First map' },
                { label: 'map2', documentation: 'Second map' },
            ],
        },
        // Additional string function signatures
        substring: {
            label: 'substring(string, start, end)',
            documentation: 'Extracts a portion of a string',
            parameters: [
                { label: 'string', documentation: 'The source string' },
                { label: 'start', documentation: 'Starting index' },
                { label: 'end', documentation: 'Ending index (exclusive)' },
            ],
        },
        indexOf: {
            label: 'indexOf(string, searchValue)',
            documentation: 'Returns the index of the first occurrence',
            parameters: [
                { label: 'string', documentation: 'The source string' },
                { label: 'searchValue', documentation: 'Value to search for' },
            ],
        },
        lastIndexOf: {
            label: 'lastIndexOf(string, searchValue)',
            documentation: 'Returns the index of the last occurrence',
            parameters: [
                { label: 'string', documentation: 'The source string' },
                { label: 'searchValue', documentation: 'Value to search for' },
            ],
        },
        charAt: {
            label: 'charAt(string, index)',
            documentation: 'Returns the character at the specified index',
            parameters: [
                { label: 'string', documentation: 'The source string' },
                { label: 'index', documentation: 'Character position' },
            ],
        },
        charCodeAt: {
            label: 'charCodeAt(string, index)',
            documentation: 'Returns the Unicode value of the character',
            parameters: [
                { label: 'string', documentation: 'The source string' },
                { label: 'index', documentation: 'Character position' },
            ],
        },
        padStart: {
            label: 'padStart(string, length, padString)',
            documentation: 'Pads the string from the start',
            parameters: [
                { label: 'string', documentation: 'The source string' },
                { label: 'length', documentation: 'Target length' },
                { label: 'padString', documentation: 'String to pad with' },
            ],
        },
        padEnd: {
            label: 'padEnd(string, length, padString)',
            documentation: 'Pads the string from the end',
            parameters: [
                { label: 'string', documentation: 'The source string' },
                { label: 'length', documentation: 'Target length' },
                { label: 'padString', documentation: 'String to pad with' },
            ],
        },
        repeat: {
            label: 'repeat(string, count)',
            documentation: 'Repeats the string the specified number of times',
            parameters: [
                { label: 'string', documentation: 'The source string' },
                { label: 'count', documentation: 'Number of repetitions' },
            ],
        },
        // Additional array function signatures
        map: {
            label: 'map(array, function)',
            documentation: 'Creates a new array with the results of calling a function',
            parameters: [
                { label: 'array', documentation: 'The source array' },
                { label: 'function', documentation: 'Function to call for each element' },
            ],
        },
        filter: {
            label: 'filter(array, function)',
            documentation: 'Creates a new array with elements that pass the test',
            parameters: [
                { label: 'array', documentation: 'The source array' },
                { label: 'function', documentation: 'Test function' },
            ],
        },
        reduce: {
            label: 'reduce(array, function, initialValue)',
            documentation: 'Reduces the array to a single value',
            parameters: [
                { label: 'array', documentation: 'The source array' },
                { label: 'function', documentation: 'Reducer function' },
                { label: 'initialValue', documentation: 'Initial accumulator value' },
            ],
        },
        find: {
            label: 'find(array, function)',
            documentation: 'Returns the first element that satisfies the test',
            parameters: [
                { label: 'array', documentation: 'The source array' },
                { label: 'function', documentation: 'Test function' },
            ],
        },
        findIndex: {
            label: 'findIndex(array, function)',
            documentation: 'Returns the index of the first element that satisfies the test',
            parameters: [
                { label: 'array', documentation: 'The source array' },
                { label: 'function', documentation: 'Test function' },
            ],
        },
        includes: {
            label: 'includes(array, value)',
            documentation: 'Checks if an array contains a specific value',
            parameters: [
                { label: 'array', documentation: 'The source array' },
                { label: 'value', documentation: 'Value to search for' },
            ],
        },
        forEach: {
            label: 'forEach(array, function)',
            documentation: 'Executes a function for each array element',
            parameters: [
                { label: 'array', documentation: 'The source array' },
                { label: 'function', documentation: 'Function to execute' },
            ],
        },
        // Type checking function signatures
        isString: {
            label: 'isString(value)',
            documentation: 'Checks if a value is a string',
            parameters: [{ label: 'value', documentation: 'Value to check' }],
        },
        isNumber: {
            label: 'isNumber(value)',
            documentation: 'Checks if a value is a number',
            parameters: [{ label: 'value', documentation: 'Value to check' }],
        },
        isArray: {
            label: 'isArray(value)',
            documentation: 'Checks if a value is an array',
            parameters: [{ label: 'value', documentation: 'Value to check' }],
        },
        isMap: {
            label: 'isMap(value)',
            documentation: 'Checks if a value is a map/object',
            parameters: [{ label: 'value', documentation: 'Value to check' }],
        },
        isNull: {
            label: 'isNull(value)',
            documentation: 'Checks if a value is null',
            parameters: [{ label: 'value', documentation: 'Value to check' }],
        },
        isBool: {
            label: 'isBool(value)',
            documentation: 'Checks if a value is a boolean',
            parameters: [{ label: 'value', documentation: 'Value to check' }],
        },
        // Additional math function signatures
        asin: {
            label: 'asin(x)',
            documentation: 'Calculates arc sine (inverse sine)',
            parameters: [{ label: 'x', documentation: 'Value between -1 and 1' }],
        },
        acos: {
            label: 'acos(x)',
            documentation: 'Calculates arc cosine (inverse cosine)',
            parameters: [{ label: 'x', documentation: 'Value between -1 and 1' }],
        },
        atan: {
            label: 'atan(x)',
            documentation: 'Calculates arc tangent (inverse tangent)',
            parameters: [{ label: 'x', documentation: 'Input value' }],
        },
        atan2: {
            label: 'atan2(y, x)',
            documentation: 'Calculates the angle between the positive x-axis and the point (x, y)',
            parameters: [
                { label: 'y', documentation: 'Y coordinate' },
                { label: 'x', documentation: 'X coordinate' },
            ],
        },
        cbrt: {
            label: 'cbrt(x)',
            documentation: 'Calculates the cube root',
            parameters: [{ label: 'x', documentation: 'Input value' }],
        },
    };

    const signature = signatures[funcName];
    if (!signature) {
        return null;
    }

    // Count commas to determine active parameter
    const paramText = lineText.substring(funcMatch.index + funcName.length + 1);
    const activeParameter = (paramText.match(/,/g) || []).length;

    return {
        signatures: [signature],
        activeSignature: 0,
        activeParameter: Math.min(activeParameter, signature.parameters.length - 1),
    };
});

// Document symbol provider
connection.onDocumentSymbol(params => {
    const document = documents.get(params.textDocument.uri);
    if (!document) {
        return [];
    }

    const text = document.getText();
    const symbols = [];
    const lines = text.split('\n');

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Function definitions
        const funcMatch = line.match(/let\s+(\w+)\s*=\s*func/);
        if (funcMatch) {
            symbols.push({
                name: funcMatch[1],
                kind: SymbolKind.Function,
                range: {
                    start: { line: i, character: 0 },
                    end: { line: i, character: line.length },
                },
                selectionRange: {
                    start: { line: i, character: funcMatch.index + 4 },
                    end: { line: i, character: funcMatch.index + 4 + funcMatch[1].length },
                },
            });
        }

        // Variable declarations
        const varMatch = line.match(/let\s+(\w+)\s*=/);
        if (varMatch && !funcMatch) {
            symbols.push({
                name: varMatch[1],
                kind: SymbolKind.Variable,
                range: {
                    start: { line: i, character: 0 },
                    end: { line: i, character: line.length },
                },
                selectionRange: {
                    start: { line: i, character: varMatch.index + 4 },
                    end: { line: i, character: varMatch.index + 4 + varMatch[1].length },
                },
            });
        }

        // Import statements
        const importMatch = line.match(/import\s+(\w+)/);
        if (importMatch) {
            symbols.push({
                name: importMatch[1],
                kind: SymbolKind.Module,
                range: {
                    start: { line: i, character: 0 },
                    end: { line: i, character: line.length },
                },
                selectionRange: {
                    start: { line: i, character: importMatch.index + 7 },
                    end: { line: i, character: importMatch.index + 7 + importMatch[1].length },
                },
            });
        }
    }

    return symbols;
});

// Go to definition provider
connection.onDefinition(params => {
    const document = documents.get(params.textDocument.uri);
    if (!document) {
        return null;
    }

    const position = params.position;
    const text = document.getText();
    const offset = document.offsetAt(position);

    // Get the word at the position
    const wordRange = getWordRangeAtPosition(text, offset);
    if (!wordRange) {
        return null;
    }

    const word = text.substring(wordRange.start, wordRange.end);

    // Search for the definition
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Check for function or variable definition
        const defMatch = line.match(new RegExp(`let\\s+(${word})\\s*=`));
        if (defMatch) {
            return {
                uri: params.textDocument.uri,
                range: {
                    start: { line: i, character: defMatch.index + 4 },
                    end: { line: i, character: defMatch.index + 4 + word.length },
                },
            };
        }

        // Check for import
        const importMatch = line.match(new RegExp(`import\\s+(${word})`));
        if (importMatch) {
            return {
                uri: params.textDocument.uri,
                range: {
                    start: { line: i, character: importMatch.index + 7 },
                    end: { line: i, character: importMatch.index + 7 + word.length },
                },
            };
        }
    }

    return null;
});

// Find references provider
connection.onReferences(params => {
    const document = documents.get(params.textDocument.uri);
    if (!document) {
        return [];
    }

    const position = params.position;
    const text = document.getText();
    const offset = document.offsetAt(position);

    // Get the word at the position
    const wordRange = getWordRangeAtPosition(text, offset);
    if (!wordRange) {
        return [];
    }

    const word = text.substring(wordRange.start, wordRange.end);
    const references = [];

    // Search for all occurrences of the word
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const regex = new RegExp(`\\b${word}\\b`, 'g');
        let match;

        while ((match = regex.exec(line))) {
            references.push({
                uri: params.textDocument.uri,
                range: {
                    start: { line: i, character: match.index },
                    end: { line: i, character: match.index + word.length },
                },
            });
        }
    }

    return references;
});

// Document highlight provider
connection.onDocumentHighlight(params => {
    const document = documents.get(params.textDocument.uri);
    if (!document) {
        return [];
    }

    const position = params.position;
    const text = document.getText();
    const offset = document.offsetAt(position);

    // Get the word at the position
    const wordRange = getWordRangeAtPosition(text, offset);
    if (!wordRange) {
        return [];
    }

    const word = text.substring(wordRange.start, wordRange.end);
    const highlights = [];

    // Highlight all occurrences in the document
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const regex = new RegExp(`\\b${word}\\b`, 'g');
        let match;

        while ((match = regex.exec(line))) {
            highlights.push({
                range: {
                    start: { line: i, character: match.index },
                    end: { line: i, character: match.index + word.length },
                },
                kind: 1, // Text
            });
        }
    }

    return highlights;
});

// Rename provider
connection.onPrepareRename(params => {
    const document = documents.get(params.textDocument.uri);
    if (!document) {
        return null;
    }

    const position = params.position;
    const text = document.getText();
    const offset = document.offsetAt(position);

    // Get the word at the position
    const wordRange = getWordRangeAtPosition(text, offset);
    if (!wordRange) {
        return null;
    }

    const word = text.substring(wordRange.start, wordRange.end);

    // Check if it's a keyword or builtin (can't rename those)
    if (vintlangConfig.keywords.includes(word) || vintlangConfig.builtins.includes(word)) {
        return null;
    }

    return {
        range: {
            start: document.positionAt(wordRange.start),
            end: document.positionAt(wordRange.end),
        },
        placeholder: word,
    };
});

connection.onRenameRequest(params => {
    const document = documents.get(params.textDocument.uri);
    if (!document) {
        return null;
    }

    const position = params.position;
    const newName = params.newName;
    const text = document.getText();
    const offset = document.offsetAt(position);

    // Get the word at the position
    const wordRange = getWordRangeAtPosition(text, offset);
    if (!wordRange) {
        return null;
    }

    const oldName = text.substring(wordRange.start, wordRange.end);
    const edits = [];

    // Find all occurrences and create edits
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const regex = new RegExp(`\\b${oldName}\\b`, 'g');
        let match;

        while ((match = regex.exec(line))) {
            edits.push({
                range: {
                    start: { line: i, character: match.index },
                    end: { line: i, character: match.index + oldName.length },
                },
                newText: newName,
            });
        }
    }

    return {
        changes: {
            [params.textDocument.uri]: edits,
        },
    };
});

// Folding range provider
connection.onFoldingRanges(params => {
    const document = documents.get(params.textDocument.uri);
    if (!document) {
        return [];
    }

    const text = document.getText();
    const lines = text.split('\n');
    const foldingRanges = [];
    const braceStack = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Track braces for folding
        for (let j = 0; j < line.length; j++) {
            if (line[j] === '{') {
                braceStack.push(i);
            } else if (line[j] === '}' && braceStack.length > 0) {
                const startLine = braceStack.pop();
                if (i > startLine) {
                    foldingRanges.push({
                        startLine: startLine,
                        endLine: i,
                        kind: FoldingRangeKind.Region,
                    });
                }
            }
        }

        // Multi-line comments
        if (line.includes('/*')) {
            const commentStart = i;
            let commentEnd = i;

            // Find the end of the comment
            for (let k = i; k < lines.length; k++) {
                if (lines[k].includes('*/')) {
                    commentEnd = k;
                    break;
                }
            }

            if (commentEnd > commentStart) {
                foldingRanges.push({
                    startLine: commentStart,
                    endLine: commentEnd,
                    kind: FoldingRangeKind.Comment,
                });
            }
        }
    }

    return foldingRanges;
});

// Document formatting provider
connection.onDocumentFormatting(params => {
    const document = documents.get(params.textDocument.uri);
    if (!document) {
        return [];
    }

    const text = document.getText();
    const lines = text.split('\n');
    const formattedLines = [];
    let indentLevel = 0;

    for (let line of lines) {
        const trimmedLine = line.trim();

        // Decrease indent for closing braces
        if (trimmedLine.startsWith('}')) {
            indentLevel = Math.max(0, indentLevel - 1);
        }

        // Apply indentation
        const indentedLine = '    '.repeat(indentLevel) + trimmedLine;
        formattedLines.push(indentedLine);

        // Increase indent for opening braces
        if (trimmedLine.endsWith('{')) {
            indentLevel++;
        }
    }

    const formattedText = formattedLines.join('\n');

    return [
        {
            range: {
                start: { line: 0, character: 0 },
                end: { line: lines.length - 1, character: lines[lines.length - 1].length },
            },
            newText: formattedText,
        },
    ];
});

// Code action provider for quick fixes
connection.onCodeAction(params => {
    const document = documents.get(params.textDocument.uri);
    if (!document) {
        return [];
    }

    const diagnostics = params.context.diagnostics;
    const codeActions = [];

    for (const diagnostic of diagnostics) {
        if (diagnostic.code === 'missing-let') {
            // Quick fix: Add 'let' to variable declaration
            // const _line = document.getText({
            //     start: { line: diagnostic.range.start.line, character: 0 },
            //     end: {
            //         line: diagnostic.range.start.line,
            //         character: 1000,
            //     },
            // });

            codeActions.push({
                title: "Add 'let' to declare variable",
                kind: 'quickfix',
                diagnostics: [diagnostic],
                edit: {
                    changes: {
                        [params.textDocument.uri]: [
                            {
                                range: {
                                    start: {
                                        line: diagnostic.range.start.line,
                                        character: 0,
                                    },
                                    end: {
                                        line: diagnostic.range.start.line,
                                        character: 0,
                                    },
                                },
                                newText: 'let ',
                            },
                        ],
                    },
                },
            });
        } else if (diagnostic.code === 'unused-symbol') {
            // Quick fix: Remove unused symbol
            const line = diagnostic.range.start.line;
            codeActions.push({
                title: 'Remove unused declaration',
                kind: 'quickfix',
                diagnostics: [diagnostic],
                edit: {
                    changes: {
                        [params.textDocument.uri]: [
                            {
                                range: {
                                    start: { line: line, character: 0 },
                                    end: { line: line + 1, character: 0 },
                                },
                                newText: '',
                            },
                        ],
                    },
                },
            });
        } else if (diagnostic.code === 'invalid-function-syntax') {
            // Suggest function syntax correction
            codeActions.push({
                title: 'Learn about VintLang function syntax',
                kind: 'quickfix',
                diagnostics: [diagnostic],
                command: {
                    title: 'Open Documentation',
                    command: 'vscode.open',
                    arguments: ['https://vintlang.ekilie.com/docs/functions'],
                },
            });
        }
    }

    return codeActions;
});

// Workspace symbol provider
connection.onWorkspaceSymbol(params => {
    const query = params.query.toLowerCase();
    const symbols = [];

    // Search across all open documents
    for (const document of documents.all()) {
        const text = document.getText();
        const lines = text.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Function definitions
            const funcMatch = line.match(/let\s+(\w+)\s*=\s*func/);
            if (funcMatch && funcMatch[1].toLowerCase().includes(query)) {
                symbols.push({
                    name: funcMatch[1],
                    kind: SymbolKind.Function,
                    location: {
                        uri: document.uri,
                        range: {
                            start: { line: i, character: 0 },
                            end: { line: i, character: line.length },
                        },
                    },
                });
            }

            // Variable declarations
            const varMatch = line.match(/let\s+(\w+)\s*=/);
            if (varMatch && !funcMatch && varMatch[1].toLowerCase().includes(query)) {
                symbols.push({
                    name: varMatch[1],
                    kind: SymbolKind.Variable,
                    location: {
                        uri: document.uri,
                        range: {
                            start: { line: i, character: 0 },
                            end: { line: i, character: line.length },
                        },
                    },
                });
            }
        }
    }

    return symbols;
});

// Document links provider (for import statements)
connection.onDocumentLinks(params => {
    const document = documents.get(params.textDocument.uri);
    if (!document) {
        return [];
    }

    const text = document.getText();
    const lines = text.split('\n');
    const links = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Look for import statements - could link to module documentation
        const importMatch = line.match(/import\s+(\w+)/);
        if (importMatch) {
            const moduleName = importMatch[1];
            const moduleStart = line.indexOf(moduleName);

            links.push({
                range: {
                    start: { line: i, character: moduleStart },
                    end: { line: i, character: moduleStart + moduleName.length },
                },
                target: `https://vintlang.ekilie.com/docs/modules/${moduleName}`,
                tooltip: `View ${moduleName} module documentation`,
            });
        }

        // Look for URLs in comments
        const urlMatch = line.match(/(https?:\/\/[^\s]+)/);
        if (urlMatch) {
            const url = urlMatch[1];
            const urlStart = line.indexOf(url);

            links.push({
                range: {
                    start: { line: i, character: urlStart },
                    end: { line: i, character: urlStart + url.length },
                },
                target: url,
            });
        }
    }

    return links;
});

// Selection range provider (smart select/expand selection)
connection.onSelectionRanges(params => {
    const document = documents.get(params.textDocument.uri);
    if (!document) {
        return [];
    }

    const text = document.getText();
    const ranges = [];

    for (const position of params.positions) {
        const offset = document.offsetAt(position);
        const selectionRanges = [];

        // Word level
        const wordRange = getWordRangeAtPosition(text, offset);
        if (wordRange) {
            selectionRanges.push({
                range: {
                    start: document.positionAt(wordRange.start),
                    end: document.positionAt(wordRange.end),
                },
            });
        }

        // Line level
        const lineStart = text.lastIndexOf('\n', offset - 1) + 1;
        const lineEnd = text.indexOf('\n', offset);
        selectionRanges.push({
            range: {
                start: document.positionAt(lineStart),
                end: document.positionAt(lineEnd === -1 ? text.length : lineEnd),
            },
            parent: selectionRanges[selectionRanges.length - 1],
        });

        // Block level (find enclosing braces)
        let braceLevel = 0;
        let blockStart = -1;
        let blockEnd = -1;

        // Search backwards for opening brace
        for (let i = offset - 1; i >= 0; i--) {
            if (text[i] === '}') braceLevel++;
            if (text[i] === '{') {
                if (braceLevel === 0) {
                    blockStart = i;
                    break;
                }
                braceLevel--;
            }
        }

        // Search forwards for closing brace
        braceLevel = 0;
        for (let i = offset; i < text.length; i++) {
            if (text[i] === '{') braceLevel++;
            if (text[i] === '}') {
                if (braceLevel === 0) {
                    blockEnd = i + 1;
                    break;
                }
                braceLevel--;
            }
        }

        if (blockStart !== -1 && blockEnd !== -1) {
            selectionRanges.push({
                range: {
                    start: document.positionAt(blockStart),
                    end: document.positionAt(blockEnd),
                },
                parent: selectionRanges[selectionRanges.length - 1],
            });
        }

        ranges.push(selectionRanges[0] || null);
    }

    return ranges;
});

// Semantic tokens provider
connection.onSemanticTokens(params => {
    const document = documents.get(params.textDocument.uri);
    if (!document) {
        return { data: [] };
    }

    const text = document.getText();
    const lines = text.split('\n');
    const builder = new SemanticTokensBuilder();

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex];

        // Match keywords
        const keywordRegex =
            /\b(if|else|elif|while|for|in|switch|case|default|break|continue|func|return|let|const|declare|defer|import|package|include|try|catch|throw|finally|as|is|async|await|go|chan|match|repeat)\b/g;
        let match;
        while ((match = keywordRegex.exec(line))) {
            builder.push(lineIndex, match.index, match[0].length, 15, 0); // keyword
        }

        // Match built-in functions
        const builtinRegex =
            /\b(print|println|write|type|convert|has_key|len|range|split|join|replace|contains|startsWith|endsWith|trim|upper|lower|push|pop|shift|unshift|slice|splice|sort|reverse|abs|ceil|floor|round|max|min|sqrt|pow|random|now|format|add|subtract|isLeapYear|exec|env|args|exit)\b/g;
        while ((match = builtinRegex.exec(line))) {
            builder.push(lineIndex, match.index, match[0].length, 12, 1 << 9); // function with defaultLibrary modifier
        }

        // Match modules
        const moduleRegex = /\b(time|net|os|json|csv|regex|crypto|encoding|colors|term)\b/g;
        while ((match = moduleRegex.exec(line))) {
            builder.push(lineIndex, match.index, match[0].length, 0, 1 << 9); // namespace with defaultLibrary
        }

        // Match function definitions
        const funcDefRegex = /let\s+(\w+)\s*=\s*func/g;
        while ((match = funcDefRegex.exec(line))) {
            const funcNameStart = line.indexOf(match[1], match.index);
            builder.push(lineIndex, funcNameStart, match[1].length, 12, 1 << 0); // function with declaration
        }

        // Match variable declarations
        const varDefRegex = /(?:let|const)\s+(\w+)\s*=/g;
        while ((match = varDefRegex.exec(line))) {
            if (!line.includes('func')) {
                // Not a function definition
                const varNameStart = line.indexOf(match[1], match.index);
                builder.push(lineIndex, varNameStart, match[1].length, 8, 1 << 0); // variable with declaration
            }
        }

        // Match string literals
        const stringRegex = /"([^"\\]*(\\.[^"\\]*)*)"|'([^'\\]*(\\.[^'\\]*)*)'/g;
        while ((match = stringRegex.exec(line))) {
            builder.push(lineIndex, match.index, match[0].length, 18, 0); // string
        }

        // Match numbers
        const numberRegex = /\b\d+(\.\d+)?\b/g;
        while ((match = numberRegex.exec(line))) {
            builder.push(lineIndex, match.index, match[0].length, 19, 0); // number
        }

        // Match comments
        if (line.includes('//')) {
            const commentStart = line.indexOf('//');
            builder.push(lineIndex, commentStart, line.length - commentStart, 17, 0); // comment
        }

        // Match operators
        const operatorRegex = /[+\-*/%=<>!&|^~]+/g;
        while ((match = operatorRegex.exec(line))) {
            if (line[match.index - 1] !== '/' && line[match.index + 1] !== '/') {
                // Not part of a comment
                builder.push(lineIndex, match.index, match[0].length, 21, 0); // operator
            }
        }

        // Match boolean literals
        const boolRegex = /\b(true|false|null)\b/g;
        while ((match = boolRegex.exec(line))) {
            builder.push(lineIndex, match.index, match[0].length, 15, 1 << 2); // keyword with readonly
        }

        // Match declarative statements
        const declarativeRegex =
            /\b(todo|warn|error|info|debug|note|success|trace|fatal|critical|log|Todo|Warn|Error|Info|Debug|Note|Success|Trace|Fatal|Critical|Log)\b/g;
        while ((match = declarativeRegex.exec(line))) {
            builder.push(lineIndex, match.index, match[0].length, 14, 0); // macro
        }
    }

    return builder.build();
});

// Inlay hints provider
connection.onInlayHint(params => {
    const document = documents.get(params.textDocument.uri);
    if (!document) {
        return [];
    }

    const text = document.getText();
    const lines = text.split('\n');
    const hints = [];

    // Parameter name hints for built-in functions
    const functionSignatures = {
        convert: ['value', 'type'],
        split: ['string', 'delimiter'],
        join: ['array', 'separator'],
        replace: ['string', 'old', 'new'],
        range: ['start', 'end', 'step'],
    };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Find function calls
        for (const [funcName, paramNames] of Object.entries(functionSignatures)) {
            const funcRegex = new RegExp(`\\b${funcName}\\s*\\(([^)]*)\\)`, 'g');
            let match;

            while ((match = funcRegex.exec(line))) {
                const args = match[1].split(',');
                let charOffset = match.index + funcName.length + 1; // Start after '('

                for (let j = 0; j < args.length && j < paramNames.length; j++) {
                    const arg = args[j].trim();
                    if (arg) {
                        // Skip whitespace
                        while (charOffset < line.length && line[charOffset] === ' ') {
                            charOffset++;
                        }

                        hints.push({
                            position: { line: i, character: charOffset },
                            label: `${paramNames[j]}:`,
                            kind: 2, // Parameter
                            paddingRight: true,
                        });

                        charOffset += arg.length + 1; // Move past arg and comma
                    }
                }
            }
        }

        // Type hints for variable declarations (inferred types)
        const varMatch = line.match(/let\s+(\w+)\s*=\s*(.+?)(?:\/\/|$)/);
        if (varMatch) {
            const value = varMatch[2].trim();
            let inferredType = null;

            if (value.startsWith('"') || value.startsWith("'")) {
                inferredType = 'string';
            } else if (/^\d+$/.test(value)) {
                inferredType = 'int';
            } else if (/^\d+\.\d+$/.test(value)) {
                inferredType = 'float';
            } else if (value === 'true' || value === 'false') {
                inferredType = 'bool';
            } else if (value.startsWith('[')) {
                inferredType = 'array';
            } else if (value.startsWith('{')) {
                inferredType = 'map';
            } else if (value.includes('func')) {
                inferredType = 'function';
            }

            if (inferredType) {
                const varNameMatch = line.match(/let\s+(\w+)/);
                if (varNameMatch) {
                    const varNameEnd = varNameMatch.index + 4 + varNameMatch[1].length;
                    hints.push({
                        position: { line: i, character: varNameEnd },
                        label: `: ${inferredType}`,
                        kind: 1, // Type
                        paddingLeft: true,
                    });
                }
            }
        }
    }

    return hints;
});

// Call hierarchy provider
connection.onPrepareCallHierarchy(params => {
    const document = documents.get(params.textDocument.uri);
    if (!document) {
        return null;
    }

    const position = params.position;
    const text = document.getText();
    const offset = document.offsetAt(position);

    // Get the word at the position
    const wordRange = getWordRangeAtPosition(text, offset);
    if (!wordRange) {
        return null;
    }

    const word = text.substring(wordRange.start, wordRange.end);

    // Find the function definition
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const funcMatch = line.match(new RegExp(`let\\s+(${word})\\s*=\\s*func`));

        if (funcMatch) {
            return [
                {
                    name: word,
                    kind: SymbolKind.Function,
                    uri: params.textDocument.uri,
                    range: {
                        start: { line: i, character: 0 },
                        end: { line: i, character: line.length },
                    },
                    selectionRange: {
                        start: { line: i, character: funcMatch.index + 4 },
                        end: { line: i, character: funcMatch.index + 4 + word.length },
                    },
                },
            ];
        }
    }

    return null;
});

connection.onCallHierarchyIncomingCalls(params => {
    const document = documents.get(params.item.uri);
    if (!document) {
        return [];
    }

    const funcName = params.item.name;
    const text = document.getText();
    const lines = text.split('\n');
    const calls = [];

    // Find all calls to this function
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const callRegex = new RegExp(`\\b${funcName}\\s*\\(`, 'g');
        let match;

        while ((match = callRegex.exec(line))) {
            // Find which function this call is in
            let callingFunction = 'global';
            for (let j = i - 1; j >= 0; j--) {
                const prevLine = lines[j];
                const funcMatch = prevLine.match(/let\s+(\w+)\s*=\s*func/);
                if (funcMatch) {
                    callingFunction = funcMatch[1];
                    calls.push({
                        from: {
                            name: callingFunction,
                            kind: SymbolKind.Function,
                            uri: params.item.uri,
                            range: {
                                start: { line: j, character: 0 },
                                end: { line: j, character: prevLine.length },
                            },
                            selectionRange: {
                                start: { line: j, character: funcMatch.index + 4 },
                                end: {
                                    line: j,
                                    character: funcMatch.index + 4 + callingFunction.length,
                                },
                            },
                        },
                        fromRanges: [
                            {
                                start: { line: i, character: match.index },
                                end: { line: i, character: match.index + funcName.length },
                            },
                        ],
                    });
                    break;
                }
            }
        }
    }

    return calls;
});

connection.onCallHierarchyOutgoingCalls(params => {
    const document = documents.get(params.item.uri);
    if (!document) {
        return [];
    }

    const funcName = params.item.name;
    const text = document.getText();
    const lines = text.split('\n');
    const calls = [];

    // Find the function definition
    let funcStartLine = -1;
    let funcEndLine = -1;
    let braceCount = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes(`let ${funcName} = func`)) {
            funcStartLine = i;
            braceCount = 0;
        }

        if (funcStartLine !== -1) {
            for (const char of line) {
                if (char === '{') braceCount++;
                if (char === '}') braceCount--;
            }

            if (braceCount === 0 && funcStartLine !== i) {
                funcEndLine = i;
                break;
            }
        }
    }

    if (funcStartLine === -1) {
        return [];
    }

    // Find all function calls within this function
    for (let i = funcStartLine; i <= (funcEndLine === -1 ? lines.length - 1 : funcEndLine); i++) {
        const line = lines[i];
        const funcCallRegex = /\b(\w+)\s*\(/g;
        let match;

        while ((match = funcCallRegex.exec(line))) {
            const calledFunc = match[1];

            // Skip keywords and built-ins
            if (
                vintlangConfig.keywords.includes(calledFunc) ||
                vintlangConfig.builtins.includes(calledFunc)
            ) {
                continue;
            }

            // Find the definition of the called function
            for (let j = 0; j < lines.length; j++) {
                const defLine = lines[j];
                const defMatch = defLine.match(new RegExp(`let\\s+(${calledFunc})\\s*=\\s*func`));

                if (defMatch) {
                    calls.push({
                        to: {
                            name: calledFunc,
                            kind: SymbolKind.Function,
                            uri: params.item.uri,
                            range: {
                                start: { line: j, character: 0 },
                                end: { line: j, character: defLine.length },
                            },
                            selectionRange: {
                                start: { line: j, character: defMatch.index + 4 },
                                end: { line: j, character: defMatch.index + 4 + calledFunc.length },
                            },
                        },
                        fromRanges: [
                            {
                                start: { line: i, character: match.index },
                                end: { line: i, character: match.index + calledFunc.length },
                            },
                        ],
                    });
                    break;
                }
            }
        }
    }

    return calls;
});

// Code lens provider - shows inline information and actions
connection.onCodeLens(params => {
    const document = documents.get(params.textDocument.uri);
    if (!document) {
        return [];
    }

    const text = document.getText();
    const lines = text.split('\n');
    const lenses = [];

    // Add code lens for functions showing reference count
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const funcMatch = line.match(/let\s+(\w+)\s*=\s*func/);

        if (funcMatch) {
            const funcName = funcMatch[1];
            // Count references to this function
            let refCount = 0;
            for (let j = 0; j < lines.length; j++) {
                if (j === i) continue; // Skip the definition line
                const refRegex = new RegExp(`\\b${funcName}\\s*\\(`);
                if (refRegex.test(lines[j])) {
                    refCount++;
                }
            }

            lenses.push({
                range: {
                    start: { line: i, character: 0 },
                    end: { line: i, character: line.length },
                },
                command: {
                    title: `${refCount} reference${refCount !== 1 ? 's' : ''}`,
                    command: 'vintlang.showReferences',
                    arguments: [params.textDocument.uri, { line: i, character: funcMatch.index }],
                },
            });
        }
    }

    return lenses;
});

// Document color provider - detects color values in code
connection.onDocumentColor(params => {
    const document = documents.get(params.textDocument.uri);
    if (!document) {
        return [];
    }

    const text = document.getText();
    const lines = text.split('\n');
    const colors = [];

    // Detect hex colors (#RRGGBB or #RGB)
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const hexRegex = /#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})\b/g;
        let match;

        while ((match = hexRegex.exec(line))) {
            const hexColor = match[1];
            let r, g, b;

            if (hexColor.length === 3) {
                // Convert #RGB to #RRGGBB
                r = parseInt(hexColor[0] + hexColor[0], 16) / 255;
                g = parseInt(hexColor[1] + hexColor[1], 16) / 255;
                b = parseInt(hexColor[2] + hexColor[2], 16) / 255;
            } else {
                r = parseInt(hexColor.substring(0, 2), 16) / 255;
                g = parseInt(hexColor.substring(2, 4), 16) / 255;
                b = parseInt(hexColor.substring(4, 6), 16) / 255;
            }

            colors.push({
                range: {
                    start: { line: i, character: match.index },
                    end: { line: i, character: match.index + match[0].length },
                },
                color: { red: r, green: g, blue: b, alpha: 1.0 },
            });
        }

        // Detect rgb() and rgba() colors
        const rgbRegex = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/g;
        while ((match = rgbRegex.exec(line))) {
            colors.push({
                range: {
                    start: { line: i, character: match.index },
                    end: { line: i, character: match.index + match[0].length },
                },
                color: {
                    red: parseInt(match[1]) / 255,
                    green: parseInt(match[2]) / 255,
                    blue: parseInt(match[3]) / 255,
                    alpha: match[4] ? parseFloat(match[4]) : 1.0,
                },
            });
        }
    }

    return colors;
});

// Color presentation provider - provides color format options
connection.onColorPresentation(params => {
    const color = params.color;
    const r = Math.round(color.red * 255);
    const g = Math.round(color.green * 255);
    const b = Math.round(color.blue * 255);
    const a = color.alpha;

    const presentations = [];

    // Hex format
    const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    presentations.push({ label: hex.toUpperCase() });

    // RGB format
    presentations.push({ label: `rgb(${r}, ${g}, ${b})` });

    // RGBA format
    if (a < 1.0) {
        presentations.push({ label: `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})` });
    }

    return presentations;
});

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();
