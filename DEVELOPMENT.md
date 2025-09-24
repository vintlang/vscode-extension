# VintLang VS Code Extension Development Guide

This guide provides comprehensive information for developers working on the VintLang VS Code extension.

## 🏗️ Architecture Overview

The extension follows the Language Server Protocol (LSP) architecture:

```
┌─────────────────┐    JSON-RPC    ┌─────────────────┐
│   VS Code       │ ◄─────────────► │ Language Server │
│   Extension     │                 │   (Node.js)     │
│   (Client)      │                 │                 │
└─────────────────┘                 └─────────────────┘
```

### Components

1. **Extension Host** (`src/extension.js`)
   - Main entry point for the VS Code extension
   - Manages LSP client connection
   - Registers immediate providers for fallback functionality
   - Handles extension commands and configuration

2. **Language Server** (`src/server.js`)
   - Implements the Language Server Protocol
   - Provides core language features:
     - Code completion
     - Diagnostics
     - Hover information
     - Document symbols
     - Code formatting
     - Folding ranges

3. **Configuration Files**
   - `package.json` - Extension manifest and dependencies
   - `language-configuration.json` - Language-specific settings
   - `syntaxes/vint.tmLanguage.json` - TextMate grammar for syntax highlighting
   - `snippets/vint.json` - Code snippets

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- VS Code (v1.74.0 or higher)
- npm or yarn package manager

### Setup Development Environment

1. **Clone the repository**
   ```bash
   git clone https://github.com/vintlang/vscode-extension.git
   cd vscode-extension
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Open in VS Code**
   ```bash
   code .
   ```

4. **Run the extension**
   - Press `F5` to open a new VS Code window with the extension loaded
   - Create a `.vint` file to test language features

### Development Scripts

```json
{
  "compile": "node src/extension.js",
  "watch": "nodemon src/extension.js",
  "test": "node test/runTest.js"
}
```

## 🔧 Key Features Implementation

### 1. Code Completion

**Location**: `src/server.js` - `connection.onCompletion()`

Features:
- Context-aware keyword completion
- Built-in function completion with snippets
- Module name completion
- Trigger characters: `.`, `(`, `{`, `[`

### 2. Diagnostics

**Location**: `src/server.js` - `validateTextDocument()`

Current validations:
- Function syntax checking (`let name = func()` pattern)
- Variable declaration warnings
- Basic syntax error detection

### 3. Hover Information

**Location**: `src/server.js` - `connection.onHover()`

Provides rich documentation for:
- Keywords with usage examples
- Built-in functions with syntax
- Modules with function lists

### 4. Document Symbols

**Location**: `src/server.js` - `connection.onDocumentSymbol()`

Extracts symbols:
- Function definitions
- Variable declarations
- Import statements

### 5. Code Folding

**Location**: `src/server.js` - `connection.onFoldingRanges()`

Supports folding:
- Code blocks (braces)
- Multi-line comments

### 6. Document Formatting

**Location**: `src/server.js` - `connection.onDocumentFormatting()`

Features:
- Automatic indentation
- Brace alignment
- Consistent spacing

## 📝 TextMate Grammar

The syntax highlighting is defined in `syntaxes/vint.tmLanguage.json` using TextMate grammar:

### Key Patterns

```json
{
  "patterns": [
    { "include": "#linecomments" },
    { "include": "#blockcomments" },
    { "include": "#strings" },
    { "include": "#numbers" },
    { "include": "#constants" },
    { "include": "#keywords" },
    { "include": "#functions" },
    { "include": "#operators" },
    { "include": "#identifiers" }
  ]
}
```

### Scopes

- `keyword.control.vint` - Control flow keywords
- `storage.type.function.vint` - Function declarations
- `support.function.builtin.vint` - Built-in functions
- `string.quoted.double.vint` - String literals
- `comment.line.double-slash.vint` - Line comments

## 🧪 Testing

### Manual Testing

1. **Open Extension Development Host**
   ```bash
   # In VS Code, press F5 or
   code --extensionDevelopmentPath=. test-workspace/
   ```

2. **Test Features**
   - Create a `.vint` file
   - Test code completion (Ctrl+Space)
   - Test hover information
   - Test go to definition (F12)
   - Test document symbols (Ctrl+Shift+O)
   - Test formatting (Shift+Alt+F)

3. **Test Error Scenarios**
   ```vint
   // Test function syntax error
   func myFunction() {  // Should show error
       print("test")
   }
   
   // Test variable warning
   myVar = "test"  // Should show warning
   ```

### Automated Testing

Create test files in `test/` directory:

```javascript
// test/completion.test.js
const assert = require('assert');
const vscode = require('vscode');

suite('Completion Tests', () => {
    test('Should provide keyword completion', async () => {
        // Test implementation
    });
});
```

## 🐛 Debugging

### Language Server Debugging

1. **Enable Tracing**
   ```json
   {
     "vintlang.trace.server": "verbose"
   }
   ```

2. **View Output**
   - View → Output → Select "VintLang Language Server"

3. **Debug Server**
   - The server runs with `--inspect=6009` in debug mode
   - Attach debugger to port 6009

### Extension Debugging

1. **Console Logging**
   ```javascript
   console.log('Extension activated');
   connection.console.log('Server message');
   ```

2. **VS Code Developer Tools**
   - Help → Toggle Developer Tools

## 📊 Performance Considerations

### Optimization Strategies

1. **Incremental Parsing**
   - Process only changed document ranges
   - Cache symbol information

2. **Lazy Loading**
   - Load language server only when `.vint` files are opened
   - Defer heavy computations

3. **Memory Management**
   - Clean up document caches on close
   - Limit diagnostic count

### Performance Monitoring

```javascript
// Measure completion time
const start = Date.now();
// ... completion logic
const duration = Date.now() - start;
connection.console.log(`Completion took ${duration}ms`);
```

## 🔄 Adding New Features

### 1. Add New Language Feature

Example: Adding "Find References" support

1. **Update Server Capabilities**
   ```javascript
   // src/server.js
   const result = {
     capabilities: {
       // ... existing capabilities
       referencesProvider: true
     }
   };
   ```

2. **Implement Handler**
   ```javascript
   connection.onReferences(params => {
     // Implementation
     return references;
   });
   ```

3. **Update Client (if needed)**
   ```javascript
   // src/extension.js - usually automatic with LSP
   ```

### 2. Add New Built-in Function

1. **Update Configuration**
   ```javascript
   // src/server.js
   const vintlangConfig = {
     builtins: [
       // ... existing
       'newFunction'
     ]
   };
   ```

2. **Add Documentation**
   ```javascript
   function getHoverDocumentation(word) {
     const docs = {
       // ... existing
       'newFunction': '**newFunction(param)** - Description'
     };
   }
   ```

3. **Add Snippet**
   ```json
   // snippets/vint.json
   {
     "NewFunction": {
       "prefix": "newfunc",
       "body": ["newFunction(${1:param})"],
       "description": "Call newFunction"
     }
   }
   ```

### 3. Add New Snippet

```json
// snippets/vint.json
{
  "NewSnippet": {
    "prefix": "trigger",
    "body": [
      "// Template",
      "${1:placeholder}",
      "$0"
    ],
    "description": "Description of the snippet"
  }
}
```

## 📦 Building and Packaging

### Development Build

```bash
npm run compile
```

### Production Package

```bash
# Install vsce (VS Code Extension CLI)
npm install -g vsce

# Package extension
vsce package

# This creates vint-x.x.x.vsix file
```

### Publishing

```bash
# Publish to VS Code Marketplace
vsce publish

# Or publish specific version
vsce publish 0.2.0
```

## 🛠️ Configuration Schema

Extension settings are defined in `package.json`:

```json
{
  "contributes": {
    "configuration": {
      "properties": {
        "vintlang.feature.enable": {
          "type": "boolean",
          "default": true,
          "description": "Enable feature"
        }
      }
    }
  }
}
```

## 📈 Roadmap Implementation

### Phase 3: Advanced Features
- [ ] Semantic highlighting
- [ ] Code actions (quick fixes)
- [ ] Rename refactoring
- [ ] Document range formatting

### Phase 4: Developer Experience
- [ ] Debugger integration
- [ ] Module resolution
- [ ] Workspace-wide refactoring
- [ ] Build task integration

### Phase 5: Modern LSP Features
- [ ] Call hierarchy
- [ ] Type hints
- [ ] Code lens
- [ ] Inline hints

## 🤝 Contributing Guidelines

1. **Code Style**
   - Use 4 spaces for indentation
   - Follow existing naming conventions
   - Add JSDoc comments for public functions

2. **Testing**
   - Test new features manually
   - Add automated tests for complex logic
   - Verify performance impact

3. **Documentation**
   - Update README.md for user-facing changes
   - Update this development guide for architecture changes
   - Add inline code comments

4. **Git Workflow**
   - Create feature branches
   - Write descriptive commit messages
   - Squash commits before merging

## 📚 Resources

- [VS Code Extension API](https://code.visualstudio.com/api)
- [Language Server Protocol](https://microsoft.github.io/language-server-protocol/)
- [TextMate Grammar Guide](https://macromates.com/manual/en/language_grammars)
- [VintLang Documentation](https://vintlang.ekilie.com/docs)

---

Happy developing! 🚀