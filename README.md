# VintLang Extension for VS Code

![VintLang Logo](./icons/vint-dark.png)

[![CI](https://github.com/vintlang/vscode-extension/actions/workflows/ci.yml/badge.svg)](https://github.com/vintlang/vscode-extension/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/visual-studio-marketplace/v/tacheraSasi.vint)](https://marketplace.visualstudio.com/items?itemName=tacheraSasi.vint)

The **official** production-ready VS Code extension for VintLang programming language with full Language Server Protocol (LSP) support. This extension provides comprehensive language support including intelligent code completion, real-time error checking, syntax highlighting, and much more.

## ✨ Features

### 🔥 Core Language Support
- **Advanced Syntax Highlighting** - Rich, semantic syntax highlighting for all VintLang constructs
- **Intelligent Code Completion** - Context-aware autocompletion for keywords, functions, modules, and variables
- **Real-time Error Diagnostics** - Instant feedback on syntax errors and potential issues
- **Smart Indentation** - Automatic code formatting and indentation
- **Bracket Matching** - Automatic bracket, parentheses, and quote pairing

### 🚀 Advanced LSP Features
- **Go to Definition** - Navigate to function and variable definitions
- **Find All References** - Find all usages of symbols across your codebase
- **Hover Documentation** - Rich documentation on hover for built-in functions and keywords
- **Symbol Navigation** - Document outline and workspace-wide symbol search
- **Signature Help** - Parameter hints for function calls
- **Code Folding** - Collapse functions, blocks, and comments for better navigation
- **Rename Refactoring** - Safely rename symbols across your codebase
- **Document Highlight** - Highlight all occurrences of the symbol under cursor
- **Code Actions** - Quick fixes for common issues (missing 'let', unused variables)
- **Semantic Highlighting** - Advanced syntax highlighting based on semantic analysis
- **Inlay Hints** - Inline parameter names and type information
- **Call Hierarchy** - Navigate function call relationships
- **Document Links** - Clickable links for imports and URLs in comments
- **Selection Ranges** - Smart expand/shrink selection (Alt+Shift+Left/Right)
- **Code Lens** - Shows reference counts and inline actions for functions
- **Color Decorators** - Visual color previews for hex and RGB color values in code

### 📝 Smart Snippets
Over 50+ pre-built code snippets for common VintLang patterns:
- Functions (regular, async, anonymous, classes)
- Control flow statements (if/else, loops, switch/case, try/catch)
- **Async/Await patterns** (async functions, await, promises)
- **Concurrency** (goroutines, channels, producer-consumer)
- HTTP requests and JSON handling
- File operations and I/O
- Time and date operations
- Error handling patterns
- **Module imports** (argparse, cli, uuid, filewatcher, kv, random, etc.)

### 🛠️ Developer Experience
- **Auto-closing pairs** for brackets, quotes, and parentheses
- **Smart commenting** with `//` and `/* */` support
- **Configurable settings** for personalized experience
- **Command palette integration** for quick actions
- **Workspace symbol search** across all `.vint` files

## 📦 Installation

### From VS Code Marketplace
1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "VintLang"
4. Click Install

### Manual Installation
1. Download the `.vsix` file from releases
2. Run `code --install-extension vint-x.x.x.vsix`

## 🚀 Getting Started

### Quick Example

Create a new file with `.vint` extension and start coding:

```js
import time
import net

// Main logic to demonstrate VintLang features
let name = "VintLang Developer"
let skills = ["programming", "debugging", "optimization"]

// Function definition with proper syntax
let greetUser = func(userName, userSkills) {
    println("Hello, " + userName + "!")
    
    for skill in userSkills {
        println("You're skilled in: " + skill)
    }
    
    // Time operations
    let currentTime = time.now()
    println("Current time: " + time.format(currentTime, "2006-01-02 15:04:05"))
    
    return "Welcome to VintLang!"
}

// Call the function
let welcomeMessage = greetUser(name, skills)
println(welcomeMessage)

// HTTP request example
let response = net.get("https://api.github.com/users/vintlang")
println("GitHub API Response:", response)

// Error handling
try {
    convert("invalid", "INTEGER")
} catch (error) {
    println("Conversion error:", error)
}
```

## ⚙️ Configuration

The extension supports various configuration options:

```json
{
    "vintlang.enable": true,
    "vintlang.trace.server": "off",
    "vintlang.maxNumberOfProblems": 100,
    "vintlang.format.enable": true,
    "vintlang.completion.enable": true,
    "vintlang.diagnostics.enable": true
}
```

### Available Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `vintlang.enable` | boolean | `true` | Enable/disable the VintLang language server |
| `vintlang.trace.server` | string | `"off"` | Trace communication between VS Code and language server |
| `vintlang.maxNumberOfProblems` | number | `100` | Maximum number of problems reported |
| `vintlang.format.enable` | boolean | `true` | Enable auto-formatting |
| `vintlang.completion.enable` | boolean | `true` | Enable intelligent code completion |
| `vintlang.diagnostics.enable` | boolean | `true` | Enable real-time error diagnostics |
| `vintlang.inlayHints.enable` | boolean | `true` | Enable inlay hints for parameters and types |
| `vintlang.semanticHighlighting.enable` | boolean | `true` | Enable semantic syntax highlighting |
| `vintlang.codeActions.enable` | boolean | `true` | Enable code actions and quick fixes |
| `vintlang.codeLens.enable` | boolean | `true` | Enable code lens showing reference counts |
| `vintlang.colorDecorators.enable` | boolean | `true` | Enable color decorators for color values |

## 🎯 Language Features

### Built-in Functions
The extension provides completion and documentation for all VintLang built-ins:

**I/O Functions:**
- `print()`, `println()`, `write()`

**Type Functions:**
- `type()`, `convert()`, `has_key()`, `len()`, `range()`

**String Functions:**
- `split()`, `join()`, `replace()`, `contains()`, `trim()`, `upper()`, `lower()`
- `substring()`, `indexOf()`, `lastIndexOf()`, `charAt()`, `charCodeAt()`
- `padStart()`, `padEnd()`, `repeat()`

**Array Functions:**
- `push()`, `pop()`, `shift()`, `unshift()`, `slice()`, `sort()`, `reverse()`
- `map()`, `filter()`, `reduce()`, `find()`, `findIndex()`, `includes()`, `forEach()`

**Math Functions:**
- `abs()`, `ceil()`, `floor()`, `round()`, `max()`, `min()`, `sqrt()`, `pow()`, `random()`
- `sin()`, `cos()`, `tan()`, `log()`, `exp()`, `toFixed()`, `parseInt()`, `parseFloat()`
- `asin()`, `acos()`, `atan()`, `atan2()`, `cbrt()`

**File I/O Functions:**
- `readFile()`, `writeFile()`, `appendFile()`, `deleteFile()`, `fileExists()`, `readDir()`, `makeDir()`

**Utility Functions:**
- `keys()`, `values()`, `entries()`, `merge()`, `clone()`, `freeze()`, `seal()`

**Type Checking Functions:**
- `isString()`, `isNumber()`, `isArray()`, `isMap()`, `isNull()`, `isBool()`

### Modules
Full support for VintLang modules with auto-completion:

**Core Modules:**
- `time` - Time and date operations
- `net` - HTTP requests and networking
- `os` - Operating system interactions
- `json` - JSON parsing and stringification
- `csv` - CSV file handling

**Advanced Modules:**
- `regex` - Regular expressions and pattern matching
- `crypto` - Cryptographic functions (hashing, encryption)
- `encoding` - Encoding/decoding utilities (base64, etc.)
- `colors` - Terminal colors and styling
- `term` - Terminal operations and control
- `argparse` - Command-line argument parsing
- `cli` - Command-line interface tools
- `uuid` - UUID generation and manipulation

**Utility Modules:**
- `math` - Advanced mathematical operations
- `string` - String manipulation utilities
- `array` - Array processing utilities
- `random` - Random number generation
- `filewatcher` - File system watching and monitoring
- `kv` - In-memory key-value storage

### Async/Await & Concurrency
Full support for modern async operations and concurrent programming:

**Async Functions:**
- `async func` - Define asynchronous functions
- `await` - Wait for promise resolution
- Promise-based async patterns

**Goroutines & Channels:**
- `go` - Execute code concurrently
- `chan` - Create channels for communication
- `send()` - Send values to channels
- `receive()` - Receive values from channels
- `close()` - Close channels
- Producer-consumer patterns

## 🔧 Commands

Access these commands via Command Palette (Ctrl+Shift+P):

- **VintLang: Restart Language Server** - Restart the language server
- **VintLang: Show References** - Find all references to symbol under cursor
- **VintLang: Show Extension Status** - Display extension and server status

## 🐛 Troubleshooting

### Language Server Issues
If you encounter issues with the language server:

1. **Restart the Language Server**: Use Command Palette → "VintLang: Restart Language Server"
2. **Check Output Panel**: View → Output → Select "VintLang Language Server"
3. **Enable Tracing**: Set `"vintlang.trace.server": "verbose"` in settings

### Common Issues

**Q: Code completion not working**
A: Ensure `"vintlang.completion.enable": true` and restart VS Code

**Q: Syntax highlighting incorrect**
A: File must have `.vint` extension and be properly saved

**Q: Diagnostics not appearing**
A: Check that `"vintlang.diagnostics.enable": true` in settings

## 🗺️ Roadmap to Modern LSP

This extension follows a comprehensive roadmap to become a fully-featured modern LSP:

### ✅ Phase 1: Core LSP Foundation (Complete)
- [x] LSP client-server architecture
- [x] Document synchronization
- [x] Basic error diagnostics
- [x] Enhanced syntax highlighting

### ✅ Phase 2: Essential Features (Complete)
- [x] Intelligent code completion
- [x] Hover information
- [x] Go to definition
- [x] Symbol navigation
- [x] Signature help

### ✅ Phase 3: Production Ready (Complete - v0.3.0)
- [x] ESLint integration for code quality
- [x] Prettier formatting
- [x] CI/CD with GitHub Actions
- [x] Comprehensive error handling
- [x] JSDoc type annotations
- [x] Security vulnerability fixes
- [x] MIT License
- [x] Contributing guidelines
- [x] VS Code workspace configuration

### 🚧 Phase 4: Advanced Features (Complete - v0.4.0)
- [x] Real-time semantic validation with symbol tracking
- [x] Advanced code folding for all block types
- [x] Document formatting with smart indentation
- [x] Code actions and quick fixes
- [x] Rename refactoring with prepare rename
- [x] Document highlight for symbol occurrences
- [x] Semantic tokens for enhanced highlighting
- [x] Inlay hints for parameters and types
- [x] Call hierarchy navigation

### 📋 Phase 5: Developer Experience (Complete - v0.4.0)
- [x] Status bar integration
- [x] Enhanced configuration options
- [x] Document links for imports and URLs
- [x] Selection ranges (smart select)
- [x] Workspace symbol search
- [x] Improved error messages with diagnostic codes

### 🎯 Phase 6: Modern LSP Features (Future)
- [ ] Debugger integration
- [ ] Import/module resolution and validation
- [ ] Integration with VintLang compiler
- [ ] Testing framework integration
- [ ] Code lens for inline actions
- [ ] Type inference improvements
- [ ] Workspace-wide refactoring operations

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Report Issues** - Found a bug? [Create an issue](https://github.com/vintlang/vscode-extension/issues)
2. **Suggest Features** - Have an idea? We'd love to hear it!
3. **Submit PRs** - Fix bugs or add features
4. **Improve Documentation** - Help others learn VintLang

### Development Setup

```bash
# Clone the repository
git clone https://github.com/vintlang/vscode-extension.git
cd vscode-extension

# Install dependencies
npm install

# Run linting
npm run lint

# Format code
npm run format

# Open in VS Code
code .

# Press F5 to launch extension development host
```

### Development Scripts

- `npm run lint` - Check code quality with ESLint
- `npm run lint:fix` - Automatically fix linting issues
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check if code is formatted
- `npm test` - Run tests
- `npm run package` - Create VSIX package
- `npm run publish` - Publish to marketplace

For detailed contributing guidelines, see [CONTRIBUTING.md](./CONTRIBUTING.md).

## 📖 VintLang Resources

- **Official Website**: [vintlang.ekilie.com](https://vintlang.ekilie.com)
- **GitHub Repository**: [github.com/vintlang/vintlang](https://github.com/vintlang/vintlang)
- **Documentation**: [vintlang.ekilie.com/docs](https://vintlang.ekilie.com/docs)
- **Examples**: Check out the `/examples` folder in the main VintLang repository

## 📄 License

This extension is licensed under the MIT License. See [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- VintLang language created by **Tachera Sasi**
- Extension developed with ❤️ by the VintLang community
- Special thanks to all contributors and users

---

**Happy coding with VintLang! 🚀**

For more information about VintLang, visit [vintlang.ekilie.com](https://vintlang.ekilie.com)
