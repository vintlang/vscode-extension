const vscode = require('vscode');
const {
    LanguageClient,
    LanguageClientOptions,
    ServerOptions,
    TransportKind,
} = require('vscode-languageclient/node');
const path = require('path');

let client;

/**
 * Activate the VintLang extension
 */
async function activate(context) {
    console.log('VintLang extension is now active!');

    // Start the language server
    await startLanguageServer(context);

    // Register commands
    registerCommands(context);

    // Register providers for immediate functionality while LSP loads
    registerProviders(context);
}

/**
 * Start the Language Server Protocol client
 */
async function startLanguageServer(context) {
    try {
        // The server is implemented as a separate Node.js module
        const serverModule = path.join(context.extensionPath, 'src', 'server.js');

        // If the extension is launched in debug mode then the debug server options are used
        // Otherwise the run options are used
        const serverOptions = {
            run: { module: serverModule, transport: TransportKind.ipc },
            debug: {
                module: serverModule,
                transport: TransportKind.ipc,
                options: { execArgv: ['--nolazy', '--inspect=6009'] },
            },
        };

        // Options to control the language client
        const clientOptions = {
            // Register the server for VintLang documents
            documentSelector: [{ scheme: 'file', language: 'vint' }],
            synchronize: {
                // Notify the server about file changes to '.vint' files contained in the workspace
                fileEvents: vscode.workspace.createFileSystemWatcher('**/.vint'),
            },
        };

        // Create the language client and start the client.
        client = new LanguageClient(
            'vintlang',
            'VintLang Language Server',
            serverOptions,
            clientOptions
        );

        // Start the client. This will also launch the server
        await client.start();
        console.log('VintLang Language Server started successfully');
    } catch (error) {
        console.error('Failed to start VintLang Language Server:', error);
        vscode.window.showErrorMessage(
            'Failed to start VintLang Language Server: ' + error.message
        );
    }
}

/**
 * Register extension commands
 */
function registerCommands(context) {
    // Command to restart the language server
    const restartServerCommand = vscode.commands.registerCommand(
        'vintlang.restartServer',
        async () => {
            if (client) {
                await client.stop();
                await startLanguageServer(context);
                vscode.window.showInformationMessage('VintLang Language Server restarted');
            }
        }
    );

    // Command to show references
    const showReferencesCommand = vscode.commands.registerCommand('vintlang.showReferences', () => {
        vscode.commands.executeCommand('editor.action.referenceSearch.trigger');
    });

    context.subscriptions.push(restartServerCommand, showReferencesCommand);
}

/**
 * Register immediate providers for basic functionality
 */
function registerProviders(context) {
    // Enhanced completion provider with more VintLang-specific features
    const completionProvider = vscode.languages.registerCompletionItemProvider(
        'vint',
        {
            provideCompletionItems(document, position, token, context) {
                const keywords = [
                    // Control flow
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
                    // Functions and declarations
                    'func',
                    'return',
                    'let',
                    'declare',
                    'defer',
                    // Modules and packages
                    'import',
                    'package',
                    'include',
                    // Types and constants
                    'true',
                    'false',
                    'null',
                    // Built-in functions
                    'print',
                    'println',
                    'write',
                    'type',
                    'convert',
                    'has_key',
                    'len',
                    'range',
                    // Error handling
                    'try',
                    'catch',
                    'throw',
                    'finally',
                ];

                const builtinFunctions = [
                    // String functions
                    'split',
                    'join',
                    'replace',
                    'contains',
                    'startsWith',
                    'endsWith',
                    'trim',
                    'upper',
                    'lower',
                    // Array functions
                    'push',
                    'pop',
                    'shift',
                    'unshift',
                    'slice',
                    'splice',
                    'sort',
                    'reverse',
                    // Math functions
                    'abs',
                    'ceil',
                    'floor',
                    'round',
                    'max',
                    'min',
                    'sqrt',
                    'pow',
                    'random',
                    // Time functions
                    'now',
                    'format',
                    'add',
                    'subtract',
                    'isLeapYear',
                    // OS functions
                    'exec',
                    'env',
                    'args',
                    'exit',
                ];

                const modules = [
                    'time',
                    'net',
                    'os',
                    'json',
                    'csv',
                    'regex',
                    'crypto',
                    'encoding',
                    'colors',
                    'term',
                ];

                const items = [];

                // Add keywords
                keywords.forEach(keyword => {
                    const item = new vscode.CompletionItem(
                        keyword,
                        vscode.CompletionItemKind.Keyword
                    );
                    item.documentation = new vscode.MarkdownString(
                        `VintLang keyword: \`${keyword}\``
                    );
                    items.push(item);
                });

                // Add built-in functions
                builtinFunctions.forEach(func => {
                    const item = new vscode.CompletionItem(
                        func,
                        vscode.CompletionItemKind.Function
                    );
                    item.insertText = new vscode.SnippetString(`${func}($1)`);
                    item.documentation = new vscode.MarkdownString(
                        `Built-in function: \`${func}()\``
                    );
                    items.push(item);
                });

                // Add modules
                modules.forEach(module => {
                    const item = new vscode.CompletionItem(
                        module,
                        vscode.CompletionItemKind.Module
                    );
                    item.documentation = new vscode.MarkdownString(
                        `VintLang module: \`${module}\``
                    );
                    items.push(item);
                });

                return items;
            },
        },
        '.'
    );

    // Hover provider for better documentation
    const hoverProvider = vscode.languages.registerHoverProvider('vint', {
        provideHover(document, position, token) {
            const range = document.getWordRangeAtPosition(position);
            const word = document.getText(range);

            const documentation = getDocumentation(word);
            if (documentation) {
                return new vscode.Hover(new vscode.MarkdownString(documentation), range);
            }
        },
    });

    // Definition provider for basic navigation
    const definitionProvider = vscode.languages.registerDefinitionProvider('vint', {
        provideDefinition(document, position, token) {
            // Basic implementation - in a full LSP this would be more sophisticated
            const range = document.getWordRangeAtPosition(position);
            const word = document.getText(range);

            // Look for function definitions in the current document
            const text = document.getText();
            const funcRegex = new RegExp(`let\\s+${word}\\s*=\\s*func`, 'g');
            let match;

            while ((match = funcRegex.exec(text))) {
                const pos = document.positionAt(match.index);
                return new vscode.Location(document.uri, pos);
            }
        },
    });

    context.subscriptions.push(completionProvider, hoverProvider, definitionProvider);
}

/**
 * Get documentation for a given word/symbol
 */
function getDocumentation(word) {
    const docs = {
        print: '**print(value)** - Prints a value to the console',
        println: '**println(value)** - Prints a value to the console with a newline',
        func: '**func** - Defines a function\n\nSyntax: `let name = func(params) { body }`',
        let: '**let** - Declares a variable\n\nSyntax: `let name = value`',
        if: '**if** - Conditional statement\n\nSyntax: `if (condition) { body }`',
        for: '**for** - Loop statement\n\nSyntax: `for item in collection { body }`',
        while: '**while** - Loop statement\n\nSyntax: `while (condition) { body }`',
        import: '**import** - Imports a module\n\nSyntax: `import module_name`',
        type: '**type(value)** - Returns the type of a value',
        convert: '**convert(value, type)** - Converts a value to the specified type',
        time: '**time** - Module for time-related operations\n\nFunctions: now(), format(), add(), subtract(), isLeapYear()',
        net: '**net** - Module for network operations\n\nFunctions: get(), post(), put(), delete()',
        json: '**json** - Module for JSON operations\n\nFunctions: parse(), stringify()',
        defer: '**defer** - Defers execution until function returns\n\nSyntax: `defer expression`',
    };

    return docs[word];
}

/**
 * Deactivate the extension
 */
function deactivate() {
    if (!client) {
        return undefined;
    }
    return client.stop();
}

module.exports = {
    activate,
    deactivate,
};
