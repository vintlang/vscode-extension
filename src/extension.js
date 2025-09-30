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
 * @param {vscode.ExtensionContext} context - The extension context
 */
async function activate(context) {
    try {
        console.log('VintLang extension is now active!');

        // Start the language server
        await startLanguageServer(context);

        // Register commands
        registerCommands(context);

        // Register providers for immediate functionality while LSP loads
        registerProviders(context);

        // Show welcome message on first activation
        const config = vscode.workspace.getConfiguration('vintlang');
        const hasShownWelcome = context.globalState.get('hasShownWelcome', false);
        if (!hasShownWelcome && config.get('enable', true)) {
            vscode.window
                .showInformationMessage(
                    'VintLang extension is now active! Press Ctrl+Space for code completion.',
                    'Got it',
                    'Settings'
                )
                .then(selection => {
                    if (selection === 'Settings') {
                        vscode.commands.executeCommand('workbench.action.openSettings', 'vintlang');
                    }
                });
            context.globalState.update('hasShownWelcome', true);
        }
    } catch (error) {
        console.error('Failed to activate VintLang extension:', error);
        vscode.window.showErrorMessage(`VintLang extension activation failed: ${error.message}`);
    }
}

/**
 * Start the Language Server Protocol client
 * @param {vscode.ExtensionContext} context - The extension context
 */
async function startLanguageServer(context) {
    try {
        // Check if language server is enabled in settings
        const config = vscode.workspace.getConfiguration('vintlang');
        if (!config.get('enable', true)) {
            console.log('VintLang language server is disabled in settings');
            return;
        }

        // The server is implemented as a separate Node.js module
        const serverModule = path.join(context.extensionPath, 'src', 'server.js');

        // Verify server file exists
        const fs = require('fs');
        if (!fs.existsSync(serverModule)) {
            throw new Error(`Language server not found at ${serverModule}`);
        }

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
                fileEvents: vscode.workspace.createFileSystemWatcher('**/*.vint'),
            },
            // Output channel for debugging
            outputChannel: vscode.window.createOutputChannel('VintLang Language Server'),
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

        // Register error handler
        client.onDidChangeState(event => {
            if (event.newState === 3) {
                // State.Stopped
                vscode.window.showWarningMessage(
                    'VintLang Language Server has stopped. Use "VintLang: Restart Language Server" to restart.'
                );
            }
        });
    } catch (error) {
        console.error('Failed to start VintLang Language Server:', error);
        vscode.window.showErrorMessage(
            `Failed to start VintLang Language Server: ${error.message}. Extension will work with limited functionality.`
        );
        // Don't throw - allow extension to continue with basic functionality
    }
}

/**
 * Register extension commands
 * @param {vscode.ExtensionContext} context - The extension context
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
 * These providers work immediately while the LSP is starting up
 * @param {vscode.ExtensionContext} context - The extension context
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
 * @param {string} word - The word to get documentation for
 * @returns {string|undefined} The documentation string or undefined
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
 * @returns {Thenable<void> | undefined}
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
