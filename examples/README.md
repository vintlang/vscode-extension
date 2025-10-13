# VintLang Extension Examples

This directory contains example VintLang files demonstrating the extension's features.

## Files

### async-demo.vint

Demonstrates VintLang's modern async/await and concurrency features:

- **Async Functions** - Define and use `async func` with promise patterns
- **Await** - Wait for promise resolution with `await` keyword
- **Goroutines** - Concurrent execution with `go` keyword
- **Channels** - Communication between goroutines with `chan`, `send`, `receive`
- **Buffered Channels** - Non-blocking channel operations with buffer
- **Producer-Consumer Pattern** - Real-world concurrency pattern
- **Async Error Handling** - Try/catch/finally with async operations
- **Defer with Async** - Cleanup with defer in async context

### modules-demo.vint

Comprehensive demonstration of all VintLang modules (19 modules):

- **argparse** - Command-line argument parsing
- **cli** - Command-line interface tools
- **uuid** - UUID generation and manipulation
- **kv** - In-memory key-value storage
- **random** - Random number generation
- **filewatcher** - File system monitoring
- **math** - Advanced mathematical operations
- **string** - String manipulation utilities
- **array** - Array processing and functional operations
- **time** - Time and date operations
- **json** - JSON encoding/decoding
- **os** - Operating system interactions
- **colors** - Terminal colors and styling
- **term** - Terminal control operations
- **crypto** - Cryptographic functions (hashing)
- **encoding** - Base64 encoding/decoding
- **regex** - Regular expression pattern matching
- **csv** - CSV parsing and generation
- **net** - HTTP requests and networking

### lsp-features-demo.vint

A comprehensive demonstration file showcasing all modern LSP features:

- **Semantic Highlighting** - Different colors for keywords, functions, variables, etc.
- **Inlay Hints** - Parameter names and type inference
- **Diagnostics** - Error and warning detection
- **Code Actions** - Quick fixes for common issues
- **Rename Refactoring** - Safe symbol renaming
- **Navigation** - Go to definition, find references
- **Document Highlight** - Symbol occurrence highlighting
- **Call Hierarchy** - Function call relationships
- **Signature Help** - Parameter hints while typing
- **Selection Ranges** - Smart expand/shrink selection
- **Document Links** - Clickable imports and URLs
- **Code Folding** - Collapse blocks and comments
- **Document Symbols** - Outline view
- **Workspace Symbols** - Cross-file search
- **Formatting** - Auto-indentation

## How to Use

1. Open this file in VS Code: `examples/lsp-features-demo.vint`
2. Try the features mentioned in the comments
3. Refer to [FEATURES.md](../FEATURES.md) for detailed documentation
4. Check [DEVELOPMENT.md](../DEVELOPMENT.md) for implementation details

## Testing Features

Follow the instructions in the demo file to test each feature. The file is organized by feature category with clear section headers.

### Quick Start

1. **Semantic Highlighting**: Just open the file - syntax should be colorful
2. **Inlay Hints**: Look after variable declarations for type hints
3. **Code Actions**: Uncomment lines marked with warnings
4. **Rename**: Press F2 on any function/variable name
5. **Go to Definition**: Press F12 on function calls
6. **Call Hierarchy**: Right-click a function → "Show Call Hierarchy"
7. **Status Bar**: Click the VintLang status in bottom-right corner

## Troubleshooting

If features don't work:
1. Ensure file has `.vint` extension
2. Check extension is active (status bar)
3. Restart language server (Ctrl+Shift+P → "VintLang: Restart Language Server")
4. Enable verbose logging: `"vintlang.trace.server": "verbose"`

## Contributing

Found a bug or want to suggest a feature? Please open an issue on GitHub!

---

**Enjoy exploring the VintLang extension! 🚀**
