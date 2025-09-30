const {
    createConnection,
    TextDocuments,
    Diagnostic,
    DiagnosticSeverity,
    ProposedFeatures,
    InitializeParams,
    DidChangeConfigurationNotification,
    CompletionItem,
    CompletionItemKind,
    TextDocumentPositionParams,
    TextDocumentSyncKind,
    InitializeResult,
    SymbolKind,
    FoldingRangeKind,
} = require('vscode-languageserver/node');

const { TextDocument } = require('vscode-languageserver-textdocument');

// Create a connection for the server, using Node's IPC as a transport.
const connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager.
const documents = new TextDocuments(TextDocument);

let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;
let hasDiagnosticRelatedInformationCapability = false;

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
    hasDiagnosticRelatedInformationCapability = !!(
        capabilities.textDocument &&
        capabilities.textDocument.publishDiagnostics &&
        capabilities.textDocument.publishDiagnostics.relatedInformation
    );

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

function getDocumentSettings(resource) {
    if (!hasConfigurationCapability) {
        return Promise.resolve(globalSettings);
    }
    let result = documentSettings.get(resource);
    if (!result) {
        result = connection.workspace.getConfiguration({
            scopeUri: resource,
            section: 'vintlang',
        });
        documentSettings.set(resource, result);
    }
    return result;
}

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
    const _settings = await getDocumentSettings(textDocument.uri);
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
    const _wordPattern = /[a-zA-Z_][a-zA-Z0-9_]*/;

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
        range:
            '**range(start, end, [step])** - Creates a range of numbers\n\n```vint\nfor i in range(0, 10) {\n    print(i)\n}\n```',
        split:
            '**split(string, delimiter)** - Splits a string by delimiter\n\n```vint\nlet parts = split("a,b,c", ",")\n```',
        join: '**join(array, separator)** - Joins array elements into a string\n\n```vint\nlet result = join(["a", "b", "c"], ",")\n```',
        time: '**time** - Module for time-related operations\n\nFunctions:\n- `now()` - Get current timestamp\n- `format(time, layout)` - Format time\n- `add(time, duration)` - Add duration to time\n- `subtract(time, duration)` - Subtract duration from time\n- `isLeapYear(year)` - Check if year is leap year',
        net: '**net** - Module for network operations\n\nFunctions:\n- `get(url)` - HTTP GET request\n- `post(url, data)` - HTTP POST request\n- `put(url, data)` - HTTP PUT request\n- `delete(url)` - HTTP DELETE request',
        json: '**json** - Module for JSON operations\n\nFunctions:\n- `parse(string)` - Parse JSON string\n- `stringify(value)` - Convert value to JSON string',
        os: '**os** - Module for operating system operations\n\nFunctions:\n- `exec(command)` - Execute shell command\n- `env(name)` - Get environment variable\n- `args()` - Get command line arguments\n- `exit(code)` - Exit program',
        defer: '**defer** - Defers execution until function returns\n\n```vint\nlet myFunc = func() {\n    defer println("This runs last")\n    println("This runs first")\n}\n```',
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
            const _line = document.getText({
                start: { line: diagnostic.range.start.line, character: 0 },
                end: {
                    line: diagnostic.range.start.line,
                    character: 1000,
                },
            });

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

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();
