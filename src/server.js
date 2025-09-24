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
    FoldingRangeKind
} = require('vscode-languageserver/node');

const { TextDocument } = require('vscode-languageserver-textdocument');

// Create a connection for the server, using Node's IPC as a transport.
const connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager.
const documents = new TextDocuments(TextDocument);

let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;
let hasDiagnosticRelatedInformationCapability = false;

// VintLang language configuration
const vintlangConfig = {
    keywords: [
        'if', 'else', 'elif', 'while', 'for', 'in', 'switch', 'case', 'default', 'break', 'continue',
        'func', 'return', 'let', 'declare', 'defer', 'import', 'package', 'include',
        'true', 'false', 'null', 'try', 'catch', 'throw', 'finally'
    ],
    builtins: [
        'print', 'println', 'write', 'type', 'convert', 'has_key', 'len', 'range',
        'split', 'join', 'replace', 'contains', 'startsWith', 'endsWith', 'trim', 'upper', 'lower',
        'push', 'pop', 'shift', 'unshift', 'slice', 'splice', 'sort', 'reverse',
        'abs', 'ceil', 'floor', 'round', 'max', 'min', 'sqrt', 'pow', 'random',
        'now', 'format', 'add', 'subtract', 'isLeapYear', 'exec', 'env', 'args', 'exit'
    ],
    modules: ['time', 'net', 'os', 'json', 'csv', 'regex', 'crypto', 'encoding', 'colors', 'term']
};

connection.onInitialize((params) => {
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
                triggerCharacters: ['.', '(', '{', '[']
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
                triggerCharacters: ['(', ',']
            },
            // Support document formatting
            documentFormattingProvider: true,
            // Support document range formatting
            documentRangeFormattingProvider: true,
            // Support rename
            renameProvider: {
                prepareProvider: true
            },
            // Support code actions
            codeActionProvider: true,
            // Support folding ranges
            foldingRangeProvider: true
        }
    };

    if (hasWorkspaceFolderCapability) {
        result.capabilities.workspace = {
            workspaceFolders: {
                supported: true
            }
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
        globalSettings = (change.settings.vintlang || defaultSettings);
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
            section: 'vintlang'
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
    const settings = await getDocumentSettings(textDocument.uri);
    const text = textDocument.getText();
    const diagnostics = [];

    // Basic VintLang syntax validation
    const lines = text.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Skip empty lines and comments
        if (!line || line.startsWith('//') || line.startsWith('/*')) {
            continue;
        }

        // Check for common syntax errors
        validateLine(line, i, textDocument, diagnostics);
    }

    // Send the computed diagnostics to VSCode.
    connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}

function validateLine(line: string, lineNumber: number, document: TextDocument, diagnostics: Diagnostic[]) {
    // Check for unmatched braces
    const openBraces = (line.match(/\{/g) || []).length;
    const closeBraces = (line.match(/\}/g) || []).length;
    
    // Check for unmatched parentheses
    const openParens = (line.match(/\(/g) || []).length;
    const closeParens = (line.match(/\)/g) || []).length;

    // Check for function syntax
    if (line.includes('func') && !line.match(/let\s+\w+\s*=\s*func/)) {
        const diagnostic = {
            severity: DiagnosticSeverity.Error,
            range: {
                start: { line: lineNumber, character: 0 },
                end: { line: lineNumber, character: line.length }
            },
            message: `Function should be declared as 'let name = func(params) { ... }'`,
            source: 'vintlang'
        };
        diagnostics.push(diagnostic);
    }

    // Check for undefined variables (basic check)
    const varMatch = line.match(/(\w+)\s*=\s*(.+)/);
    if (varMatch && !line.includes('let') && !vintlangConfig.keywords.includes(varMatch[1])) {
        // This is a basic check - a full implementation would track scope
        const diagnostic = {
            severity: DiagnosticSeverity.Warning,
            range: {
                start: { line: lineNumber, character: 0 },
                end: { line: lineNumber, character: varMatch[1].length }
            },
            message: `Consider using 'let' to declare variable '${varMatch[1]}'`,
            source: 'vintlang'
        };
        diagnostics.push(diagnostic);
    }
}

// This handler provides the initial list of the completion items.
connection.onCompletion(
    (_textDocumentPosition) => {
        const items = [];

        // Add keywords
        vintlangConfig.keywords.forEach((keyword, index) => {
            items.push({
                label: keyword,
                kind: CompletionItemKind.Keyword,
                data: index
            });
        });

        // Add built-in functions
        vintlangConfig.builtins.forEach((builtin, index) => {
            items.push({
                label: builtin,
                kind: CompletionItemKind.Function,
                data: vintlangConfig.keywords.length + index,
                insertText: `${builtin}($1)`,
                insertTextFormat: 2 // Snippet format
            });
        });

        // Add modules
        vintlangConfig.modules.forEach((module, index) => {
            items.push({
                label: module,
                kind: CompletionItemKind.Module,
                data: vintlangConfig.keywords.length + vintlangConfig.builtins.length + index
            });
        });

        return items;
    }
);

// This handler resolves additional information for the item selected in
// the completion list.
connection.onCompletionResolve(
    (item) => {
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
    }
);

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
                value: documentation
            },
            range: {
                start: document.positionAt(wordRange.start),
                end: document.positionAt(wordRange.end)
            }
        };
    }

    return null;
});

function getWordRangeAtPosition(text: string, offset: number) {
    let start = offset;
    let end = offset;
    
    // Find word boundaries
    const wordPattern = /[a-zA-Z_][a-zA-Z0-9_]*/;
    
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
        'print': '**print(value)** - Prints a value to the console\n\n```vint\nprint("Hello, World!")\n```',
        'println': '**println(value)** - Prints a value to the console with a newline\n\n```vint\nprintln("Hello, World!")\n```',
        'func': '**func** - Defines a function\n\n```vint\nlet myFunction = func(param1, param2) {\n    return param1 + param2\n}\n```',
        'let': '**let** - Declares a variable\n\n```vint\nlet myVariable = "Hello"\nlet myNumber = 42\n```',
        'if': '**if** - Conditional statement\n\n```vint\nif (condition) {\n    // code\n} else {\n    // alternative code\n}\n```',
        'for': '**for** - Loop statement\n\n```vint\nfor item in collection {\n    print(item)\n}\n```',
        'while': '**while** - Loop statement\n\n```vint\nwhile (condition) {\n    // code\n}\n```',
        'import': '**import** - Imports a module\n\n```vint\nimport time\nimport net\n```',
        'type': '**type(value)** - Returns the type of a value\n\n```vint\nlet t = type(42)  // "INTEGER"\n```',
        'convert': '**convert(value, type)** - Converts a value to the specified type\n\n```vint\nlet str = "123"\nconvert(str, "INTEGER")\n```',
        'time': '**time** - Module for time-related operations\n\nFunctions:\n- `now()` - Get current timestamp\n- `format(time, layout)` - Format time\n- `add(time, duration)` - Add duration to time\n- `subtract(time, duration)` - Subtract duration from time\n- `isLeapYear(year)` - Check if year is leap year',
        'net': '**net** - Module for network operations\n\nFunctions:\n- `get(url)` - HTTP GET request\n- `post(url, data)` - HTTP POST request\n- `put(url, data)` - HTTP PUT request\n- `delete(url)` - HTTP DELETE request',
        'defer': '**defer** - Defers execution until function returns\n\n```vint\nlet myFunc = func() {\n    defer println("This runs last")\n    println("This runs first")\n}\n```'
    };

    return docs[word] || null;
}

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
                    end: { line: i, character: line.length }
                },
                selectionRange: {
                    start: { line: i, character: funcMatch.index + 4 },
                    end: { line: i, character: funcMatch.index + 4 + funcMatch[1].length }
                }
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
                    end: { line: i, character: line.length }
                },
                selectionRange: {
                    start: { line: i, character: varMatch.index + 4 },
                    end: { line: i, character: varMatch.index + 4 + varMatch[1].length }
                }
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
                    end: { line: i, character: line.length }
                },
                selectionRange: {
                    start: { line: i, character: importMatch.index + 7 },
                    end: { line: i, character: importMatch.index + 7 + importMatch[1].length }
                }
            });
        }
    }

    return symbols;
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
                        kind: FoldingRangeKind.Region
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
                    kind: FoldingRangeKind.Comment
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
    
    return [{
        range: {
            start: { line: 0, character: 0 },
            end: { line: lines.length - 1, character: lines[lines.length - 1].length }
        },
        newText: formattedText
    }];
});

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();