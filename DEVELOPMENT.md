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

### 2. Diagnostics with Symbol Table

**Location**: `src/server.js` - `validateTextDocument()`, `SymbolTable` class

Advanced validation system:
- **Two-pass analysis**: 
  - First pass: Collect all symbol definitions (functions, variables, imports)
  - Second pass: Validate references and track usage
- **Symbol tracking**: Each document has its own symbol table
- **Unused detection**: Identifies unused variables and functions
- **Diagnostic codes**: All diagnostics include codes for quick fixes
  - `missing-let` - Variable declared without 'let'
  - `unused-symbol` - Unused variable or function
  - `invalid-function-syntax` - Incorrect function syntax
  - `unmatched-brace` - Unmatched closing brace
  - `unmatched-paren` - Unmatched parentheses

### 3. Code Actions & Quick Fixes

**Location**: `src/server.js` - `connection.onCodeAction()`

Provides contextual quick fixes:
- **Add 'let'**: Automatically insert 'let' keyword
- **Remove unused**: Remove unused variable/function declarations
- **Documentation**: Open relevant VintLang documentation

### 4. Hover Information

**Location**: `src/server.js` - `connection.onHover()`

Provides rich documentation for:
- Keywords with usage examples
- Built-in functions with syntax
- Modules with function lists
- Enhanced with more built-in functions

### 5. Document Symbols

**Location**: `src/server.js` - `connection.onDocumentSymbol()`

Extracts symbols:
- Function definitions
- Variable declarations
- Import statements

### 6. Navigation Features

**Locations**: 
- `connection.onDefinition()` - Go to definition
- `connection.onReferences()` - Find all references
- `connection.onDocumentHighlight()` - Highlight symbol occurrences

Features:
- Navigate to function and variable definitions
- Find all usages across document
- Automatic highlighting of current symbol

### 7. Rename Refactoring

**Location**: `src/server.js` - `connection.onPrepareRename()`, `connection.onRenameRequest()`

Safe renaming:
- Validates renameable symbols (not keywords/builtins)
- Updates all references across document
- Provides placeholder with current name

### 8. Signature Help

**Location**: `src/server.js` - `connection.onSignatureHelp()`

Parameter hints for built-in functions:
- Shows function signature
- Highlights active parameter
- Displays parameter documentation
- Supports: print, println, type, convert, len, range, split, join

### 9. Semantic Tokens

**Location**: `src/server.js` - `connection.onSemanticTokens()`

Enhanced syntax highlighting with 22 token types:
- **Keywords**: if, else, for, while, etc.
- **Built-in functions**: Marked as default library
- **Modules**: Namespaces for import statements
- **Variables**: Declaration highlighting
- **Functions**: User-defined functions
- **Literals**: Strings, numbers, booleans
- **Operators**: Arithmetic and logical
- **Comments**: Line and block comments
- **Declarative statements**: todo, warn, error, etc.

### 10. Inlay Hints

**Location**: `src/server.js` - `connection.onInlayHint()`

Inline information display:
- **Parameter names**: Shows parameter names for function calls
- **Type hints**: Inferred types for variable declarations
  - string, int, float, bool, array, map, function

### 11. Call Hierarchy

**Location**: `src/server.js` - `connection.onPrepareCallHierarchy()`, `connection.onCallHierarchyIncomingCalls()`, `connection.onCallHierarchyOutgoingCalls()`

Function call navigation:
- **Incoming calls**: Shows which functions call the current function
- **Outgoing calls**: Shows which functions the current function calls
- Visualizes function call relationships

### 12. Document Links

**Location**: `src/server.js` - `connection.onDocumentLinks()`

Clickable links:
- Import statements → Module documentation
- URLs in comments → External links

### 13. Selection Ranges

**Location**: `src/server.js` - `connection.onSelectionRanges()`

Smart expand/shrink selection:
- Word level → Line level → Block level
- Supports Alt+Shift+Left/Right shortcuts

### 14. Workspace Symbols

**Location**: `src/server.js` - `connection.onWorkspaceSymbol()`

Search symbols across all files:
- Functions, variables, and imports
- Query-based filtering

### 15. Code Folding

**Location**: `src/server.js` - `connection.onFoldingRanges()`

Supports folding:
- Code blocks (braces)
- Multi-line comments

### 16. Document Formatting

**Location**: `src/server.js` - `connection.onDocumentFormatting()`

Features:
- Automatic indentation
- Brace alignment
- Consistent spacing

### 17. Code Lens (NEW in v0.5.0)

**Location**: `src/server.js` - `connection.onCodeLens()`

Inline actionable information:
- **Reference counts**: Shows how many times each function is called
- **Interactive**: Click to navigate to all references
- **Real-time updates**: Updates automatically as code changes
- **Configuration**: Toggle via `vintlang.codeLens.enable`

### 18. Color Decorators (NEW in v0.5.0)

**Location**: `src/server.js` - `connection.onDocumentColor()`, `connection.onColorPresentation()`

Visual color previews:
- **Hex colors**: Detects #RGB and #RRGGBB formats
- **RGB/RGBA**: Supports rgb() and rgba() color values
- **Color picker**: Integrated VS Code color picker
- **Format conversion**: Convert between hex, RGB, and RGBA
- **Configuration**: Toggle via `vintlang.colorDecorators.enable`

## 🆕 New Built-in Functions (v0.5.0)

### File I/O Functions

Added 7 new file system operations:

```javascript
// src/server.js - vintlangConfig.builtins
'readFile',      // Read file contents
'writeFile',     // Write content to file
'appendFile',    // Append to file
'deleteFile',    // Delete a file
'fileExists',    // Check if file exists
'readDir',       // List directory contents
'makeDir',       // Create directory
```

### Enhanced Math Functions

Added 8 new mathematical operations:

```javascript
'sin', 'cos', 'tan',    // Trigonometric functions
'log', 'exp',           // Logarithmic and exponential
'toFixed',              // Format to fixed decimals
'parseInt',             // Parse string to integer
'parseFloat',           // Parse string to float
```

### Utility Functions

Added 8 new utility functions:

```javascript
'keys',      // Get map keys
'values',    // Get map values
'entries',   // Get [key, value] pairs
'merge',     // Merge two maps
'clone',     // Deep copy
'freeze',    // Prevent modifications
'seal',      // Prevent new properties
```

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

2. **Test Core Features**
   - Create a `.vint` file
   - Test code completion (Ctrl+Space)
   - Test hover information
   - Test go to definition (F12)
   - Test document symbols (Ctrl+Shift+O)
   - Test formatting (Shift+Alt+F)

3. **Test Advanced Features**
   
   **Semantic Tokens**:
   - Open a .vint file and observe syntax highlighting
   - Built-in functions should be highlighted differently
   - Keywords, operators, strings should have distinct colors
   
   **Inlay Hints**:
   - Declare a variable: `let x = 42`
   - Should see `: int` hint after variable name
   - Call a function: `convert("123", "INTEGER")`
   - Should see `value:` and `type:` hints before arguments
   
   **Code Actions**:
   - Write: `x = 5` (without let)
   - Lightbulb should appear with "Add 'let'" quick fix
   - Declare unused variable: `let unused = "test"`
   - Should get hint with "Remove unused" quick fix
   
   **Rename Refactoring**:
   - Right-click a function/variable name
   - Select "Rename Symbol" (F2)
   - Type new name and press Enter
   - All references should update
   
   **Call Hierarchy**:
   - Right-click a function name
   - Select "Show Call Hierarchy"
   - Should see incoming and outgoing calls
   
   **Document Highlight**:
   - Click on a variable/function name
   - All occurrences should highlight automatically
   
   **Selection Ranges**:
   - Place cursor in code
   - Press Alt+Shift+Right repeatedly
   - Selection should expand: word → line → block
   
   **Document Links**:
   - Write: `import time`
   - "time" should be underlined (Ctrl+click to open docs)
   - Add URL in comment
   - URL should be clickable
   
   **Code Lens** (NEW in v0.5.0):
   - Define a function and call it multiple times
   - Should see reference count above function (e.g., "3 references")
   - Click on code lens to navigate to all references
   
   **Color Decorators** (NEW in v0.5.0):
   - Write: `let color = "#FF5733"`
   - Should see color swatch next to the value
   - Click the color to open color picker
   - Try different formats: `#RGB`, `rgb(255, 87, 51)`, `rgba(255, 87, 51, 0.8)`
   
   **New Built-in Functions** (NEW in v0.5.0):
   - Test file I/O: `readFile("test.txt")` - should show in completion
   - Test math: `sin(0)`, `toFixed(3.14, 1)` - should show signature help
   - Test utilities: `keys(map)`, `merge(m1, m2)` - should show documentation on hover

4. **Test Error Scenarios**
   ```vint
   // Test function syntax error
   func myFunction() {  // Should show error
       print("test")
   }
   
   // Test variable warning
   myVar = "test"  // Should show warning about missing 'let'
   
   // Test unused variable
   let unused = "value"  // Should show hint (unused)
   
   // Test unmatched braces
   if (true) {
       print("test")
   }}  // Should show error
   ```

5. **Test Status Bar**
   - Click status bar item (bottom right)
   - Should show extension status dialog
   - Test "Open Settings" and "Restart Server" actions

### Performance Testing

1. **Large Files**
   - Create a .vint file with 1000+ lines
   - Test completion response time
   - Test diagnostics update speed
   - Monitor CPU usage

2. **Multiple Files**
   - Create workspace with 10+ .vint files
   - Test workspace symbol search
   - Test find all references across files
   - Check memory usage

### Automated Testing

Currently manual testing only. Automated tests to be added:

```javascript
// Future test structure
suite('VintLang Extension Tests', () => {
    test('Activation', () => {
        // Test extension activates
    });
    
    test('Completion Provider', () => {
        // Test completions are provided
    });
    
    test('Diagnostics', () => {
        // Test diagnostics are reported
    });
});
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

4. **Add Signature Help** (Optional, for functions with parameters)
   ```javascript
   // src/server.js - signatures object
   const signatures = {
     newFunction: {
       label: 'newFunction(param1, param2)',
       documentation: 'Description of what the function does',
       parameters: [
         { label: 'param1', documentation: 'First parameter' },
         { label: 'param2', documentation: 'Second parameter' },
       ],
     },
   };
   ```

5. **Update Extension.js Completion**
   ```javascript
   // src/extension.js - builtinFunctions array
   const builtinFunctions = [
     // ... existing
     'newFunction',
   ];
   ```

6. **Update Documentation**
   - Add to README.md under "Built-in Functions"
   - Add to FEATURES.md with examples
   - Update CHANGELOG.md

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

### ✅ Phase 1-5: Complete (v0.4.0)

All planned LSP features have been implemented:

- [x] **Enhanced Diagnostics**
  - [x] Symbol table with scope tracking
  - [x] Unused variable/function detection
  - [x] Diagnostic codes for all errors
  - [x] Brace/parenthesis matching

- [x] **Code Actions**
  - [x] Quick fixes for common issues
  - [x] Add 'let' keyword
  - [x] Remove unused symbols
  - [x] Documentation links

- [x] **Advanced Navigation**
  - [x] Semantic highlighting (22 token types)
  - [x] Rename refactoring
  - [x] Document highlight
  - [x] Go to definition
  - [x] Find all references
  - [x] Call hierarchy
  - [x] Workspace symbols

- [x] **Code Intelligence**
  - [x] Signature help with parameter docs
  - [x] Inlay hints (parameters and types)
  - [x] Enhanced hover information
  - [x] Document links

- [x] **Developer Experience**
  - [x] Status bar integration
  - [x] Selection ranges (smart select)
  - [x] Enhanced configuration
  - [x] Better error reporting

### Phase 6: Future Enhancements

- [ ] Debugger integration
- [ ] Module resolution and validation
- [ ] Integration with VintLang compiler
- [ ] Testing framework integration
- [ ] Code lens for inline actions
- [ ] Workspace-wide refactoring operations

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