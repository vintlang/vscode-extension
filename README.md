# VintLang Extension for VS Code

![VintLang Logo](./icons/vint-dark.png)

The **official** VS Code extension for VintLang programming language with full Language Server Protocol (LSP) support. This extension provides comprehensive language support including intelligent code completion, real-time error checking, syntax highlighting, and much more.

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

### 📝 Smart Snippets
Over 30 pre-built code snippets for common VintLang patterns:
- Functions and classes
- Control flow statements
- HTTP requests and JSON handling
- File operations
- Time and date operations
- Error handling patterns

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

## 🎯 Language Features

### Built-in Functions
The extension provides completion and documentation for all VintLang built-ins:

**I/O Functions:**
- `print()`, `println()`, `write()`

**Type Functions:**
- `type()`, `convert()`, `has_key()`, `len()`, `range()`

**String Functions:**
- `split()`, `join()`, `replace()`, `contains()`, `trim()`, `upper()`, `lower()`

**Array Functions:**
- `push()`, `pop()`, `shift()`, `unshift()`, `slice()`, `sort()`, `reverse()`

**Math Functions:**
- `abs()`, `ceil()`, `floor()`, `round()`, `max()`, `min()`, `sqrt()`, `pow()`, `random()`

### Modules
Full support for VintLang modules with auto-completion:
- `time` - Time and date operations
- `net` - HTTP requests and networking
- `os` - Operating system interactions
- `json` - JSON parsing and stringification
- `csv` - CSV file handling
- `regex` - Regular expressions
- `crypto` - Cryptographic functions
- `encoding` - Encoding/decoding utilities
- `colors` - Terminal colors
- `term` - Terminal operations

## 🔧 Commands

Access these commands via Command Palette (Ctrl+Shift+P):

- **VintLang: Restart Language Server** - Restart the language server
- **VintLang: Show References** - Find all references to symbol under cursor

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

### 🚧 Phase 3: Advanced Features (In Progress)
- [ ] Real-time semantic validation
- [ ] Advanced code folding
- [ ] Document formatting
- [ ] Code actions and quick fixes
- [ ] Rename refactoring

### 📋 Phase 4: Developer Experience (Planned)
- [ ] Debugger integration
- [ ] Import/module resolution
- [ ] Workspace-wide refactoring
- [ ] Integration with VintLang compiler
- [ ] Testing framework integration

### 🎯 Phase 5: Modern LSP Features (Future)
- [ ] Call hierarchy
- [ ] Type hints and inference
- [ ] Code lens
- [ ] Inline hints
- [ ] Semantic tokens
- [ ] Document links

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

# Open in VS Code
code .

# Press F5 to launch extension development host
```

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
