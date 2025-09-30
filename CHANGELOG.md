# Change Log

All notable changes to the VintLang VS Code extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [0.5.0] - 2024-12-XX (Enhanced Features Release)

### 🎉 New Features

#### Code Lens Support
- **Reference Counts** - Shows number of references for each function inline
- **Interactive Actions** - Click on code lens to navigate to references
- **Configurable** - Enable/disable via `vintlang.codeLens.enable` setting

#### Color Decorators
- **Color Preview** - Visual color decorators for hex colors (#RGB, #RRGGBB)
- **RGB Support** - Detects rgb() and rgba() color values
- **Color Picker** - Edit colors with built-in VS Code color picker
- **Multiple Formats** - Convert between hex, RGB, and RGBA formats
- **Configurable** - Enable/disable via `vintlang.colorDecorators.enable` setting

#### New Built-in Functions

**File I/O Operations:**
- `readFile(path)` - Read file contents
- `writeFile(path, content)` - Write to file
- `appendFile(path, content)` - Append to file
- `deleteFile(path)` - Delete a file
- `fileExists(path)` - Check file existence
- `readDir(path)` - Read directory contents
- `makeDir(path)` - Create directory

**Enhanced Math Functions:**
- `sin(x)`, `cos(x)`, `tan(x)` - Trigonometric functions
- `log(x)` - Natural logarithm
- `exp(x)` - Exponential function
- `toFixed(number, digits)` - Format number to fixed decimals
- `parseInt(string)` - Parse integer from string
- `parseFloat(string)` - Parse float from string

**Utility Functions:**
- `keys(map)` - Get array of map keys
- `values(map)` - Get array of map values
- `entries(map)` - Get array of [key, value] pairs
- `merge(map1, map2)` - Merge two maps
- `clone(value)` - Deep copy of value
- `freeze(object)` - Freeze object to prevent modifications
- `seal(object)` - Seal object to prevent adding properties

### Enhanced

- **Hover Documentation** - Added documentation for all new built-in functions
- **Signature Help** - Extended to include file I/O, math, and utility functions
- **Code Completion** - All new functions available in IntelliSense
- **Snippets** - Added 14 new snippets for new built-in functions
  - File I/O: readfile, writefile, appendfile, fileexists, readdir, makedir
  - Parsing: parseint, parsefloat, tofixed
  - Utilities: keys, values, merge, clone
- **Configuration** - Two new settings for code lens and color decorators

### Documentation

- Updated README with new features and functions
- Added code lens and color decorator documentation
- Enhanced configuration table with new settings
- Updated examples to showcase new capabilities

## [0.4.0] - 2024-12-XX (Modern LSP Features Release)

### 🚀 Major Features

This release transforms the VintLang extension into a fully-featured modern Language Server Protocol implementation with advanced code intelligence features.

### Added - Advanced LSP Features

#### Enhanced Diagnostics & Validation
- **Symbol Table Tracking** - Full scope tracking for variables, functions, and imports
- **Unused Symbol Detection** - Identifies unused variables and functions with hints
- **Better Error Messages** - All diagnostics now include codes for quick identification
- **Unmatched Brace Detection** - Warns about unmatched braces and parentheses
- **Semantic Validation** - Context-aware validation based on symbol usage

#### Code Actions & Quick Fixes
- **Add 'let' Quick Fix** - Automatically add missing 'let' keyword to variable declarations
- **Remove Unused Code** - Quick fix to remove unused variable/function declarations
- **Documentation Links** - Clickable links to VintLang documentation for errors

#### Navigation & Refactoring
- **Rename Refactoring** - Safe symbol renaming across entire codebase with prepare rename
- **Enhanced Go to Definition** - Navigate to function, variable, and module definitions
- **Find All References** - Find all usages of any symbol across documents
- **Document Highlight** - Automatically highlight all occurrences of symbol under cursor
- **Call Hierarchy** - Navigate incoming and outgoing function calls
- **Workspace Symbol Search** - Search for symbols across all files in workspace

#### Semantic Features
- **Semantic Tokens** - Advanced syntax highlighting based on semantic analysis
  - Distinguishes functions, variables, modules, keywords, operators, etc.
  - Highlights built-in functions differently from user-defined ones
  - Special highlighting for declarative statements
- **Inlay Hints** - Inline parameter names and type information
  - Parameter names shown for function calls
  - Type inference hints for variable declarations
  - Toggle via `vintlang.inlayHints.enable` setting
- **Signature Help Enhancement** - Extended to 8+ built-in functions with detailed documentation

#### Smart Features
- **Document Links** - Clickable links for:
  - Import statements linking to module documentation
  - URLs in comments
- **Selection Ranges** - Smart expand/shrink selection (Alt+Shift+Left/Right)
  - Word level → Line level → Block level
- **Enhanced Hover** - More comprehensive documentation for built-in functions and modules

#### Developer Experience
- **Status Bar Integration** - Shows extension status with visual indicators
  - Green checkmark when active
  - Alert icon when stopped or error
  - Click to show detailed status
- **Show Extension Status Command** - New command to display:
  - Server running state
  - Current configuration
  - Quick access to settings and restart
- **Enhanced Configuration** - New settings:
  - `vintlang.inlayHints.enable` - Toggle inlay hints
  - `vintlang.semanticHighlighting.enable` - Toggle semantic highlighting
  - `vintlang.codeActions.enable` - Toggle code actions

### Enhanced
- **Completion Provider** - More context-aware completions with better sorting
- **Document Symbols** - Enhanced with proper selection ranges
- **Folding Ranges** - Improved block detection and folding accuracy
- **Hover Documentation** - Added documentation for more built-in functions (len, range, split, join, os, json modules)

### Technical Improvements
- **Symbol Resolution** - Two-pass analysis for accurate symbol tracking
- **Reference Tracking** - Efficient reference counting for unused detection
- **Error Recovery** - Better error handling in all LSP features
- **Performance** - Optimized token scanning and symbol lookup

### Breaking Changes
None - All changes are backward compatible

## [0.3.0] - 2024-12-XX (Production Ready Release)

### 🎉 Production Ready Improvements

This release focuses on making the extension production-ready with comprehensive developer experience improvements, proper tooling, and CI/CD infrastructure.

### Added
- **ESLint Integration** - Code quality checks with auto-fixing capabilities
- **Prettier Formatting** - Consistent code formatting across the project
- **GitHub Actions CI/CD** - Automated testing, linting, and building on every push
- **Release Automation** - Automated releases to VS Code Marketplace via GitHub Actions
- **Contributing Guide** - Comprehensive CONTRIBUTING.md with contribution guidelines
- **MIT License** - Open source license for community contributions
- **VS Code Workspace Settings** - Pre-configured settings for optimal development experience
- **JSDoc Type Annotations** - Better IntelliSense and type checking in JavaScript
- **Error Boundaries** - Graceful error handling throughout the extension
- **Welcome Message** - First-run experience for new users
- **Output Channel** - Dedicated output channel for Language Server debugging

### Enhanced
- **Better Error Handling** - Comprehensive error catching and user-friendly error messages
- **Performance Optimizations** - Lazy loading and efficient resource management
- **File Watching** - Fixed file watcher pattern from `**/.vint` to `**/*.vint`
- **Language Server Lifecycle** - State monitoring and automatic restart suggestions
- **Package Scripts** - Improved npm scripts for development workflow
- **Package Metadata** - Enhanced package.json with keywords, license, and repository info

### Fixed
- **Security Vulnerabilities** - Updated nodemon from 2.0.20 to 3.1.10 (fixes 3 high severity issues)
- **TypeScript Syntax Errors** - Removed TypeScript type annotations from JavaScript files
- **Build Artifacts** - Removed .vsix, .DS_Store, and bun.lock from version control

### Developer Experience
- **VS Code Tasks** - Pre-configured tasks for lint, format, and test
- **Launch Configurations** - Debug configurations for extension development
- **Recommended Extensions** - Auto-suggest useful VS Code extensions
- **Code Style Enforcement** - Consistent 4-space indentation and formatting rules
- **Format on Save** - Automatic code formatting on file save
- **ESLint Auto-fix** - Automatic linting fixes on save
- **.vscodeignore** - Properly excludes development files from extension package
- **jsconfig.json** - Better JavaScript IntelliSense and type checking

### Infrastructure
- **Continuous Integration** - Automated tests and builds on every PR
- **Continuous Deployment** - Automated releases on version tags
- **Build Validation** - Ensures extension packages successfully before release
- **Artifact Uploads** - CI artifacts for manual testing

## [0.2.0] - 2024-12-19

### 🚀 Major LSP Implementation
This version transforms the extension from a basic syntax-only extension to a full-featured Language Server Protocol implementation.

### Added
- **Language Server Protocol (LSP)** - Complete client-server architecture for modern language support
- **Intelligent Code Completion** - Context-aware autocompletion for keywords, built-ins, and modules
- **Real-time Diagnostics** - Instant syntax error detection and validation
- **Hover Documentation** - Rich documentation on hover for functions and keywords
- **Go to Definition** - Navigate to function and variable definitions
- **Symbol Navigation** - Document outline and workspace symbol search
- **Signature Help** - Parameter hints for function calls
- **Enhanced Syntax Highlighting** - Semantic syntax highlighting with proper scoping
- **Smart Indentation** - Automatic indentation and formatting rules
- **Code Folding** - Support for folding functions, blocks, and comments
- **30+ Code Snippets** - Comprehensive snippets for all VintLang patterns
- **Configuration Options** - Customizable settings for personalized experience
- **Command Integration** - Command palette commands for LSP actions

### Enhanced
- **TextMate Grammar** - Completely rewritten for better syntax highlighting
- **Language Configuration** - Advanced bracket matching, auto-closing, and indentation
- **Snippets Collection** - Expanded from 10 to 30+ snippets with proper VintLang syntax
- **Documentation** - Comprehensive README with examples and troubleshooting

### Fixed
- Function syntax highlighting now properly recognizes `let name = func()` pattern
- Import statements no longer show false positive errors
- Bracket matching and auto-closing work correctly
- Comment syntax properly supported for both `//` and `/* */`

### Developer Experience
- Added extension activation events for better performance
- Implemented proper error handling and logging
- Added development scripts and dependencies
- Created comprehensive roadmap for future improvements

## [0.1.0] - 2024-12-19

### Fixed
- Updated function snippets to use correct VintLang syntax (`let name = func()` instead of `function`)
- Fixed import snippets to match VintLang syntax (removed `from` keyword)
- Removed unnecessary semicolons from snippets to match VintLang style
- Fixed package.json structure (moved misplaced commands and keybindings)
- Added snippets contribution to package.json

### Added
- `println` snippet for print with newline
- `convert` snippet for type conversion
- Updated package snippet to use block syntax

### Changed
- Updated VSCode engine requirement to ^1.74.0 for better compatibility
- Bumped extension version to 0.1.0
- Enhanced language aliases to include "VintLang"

## [0.0.1] - Initial

- Initial release with basic syntax highlighting
- Basic snippets for common VintLang constructs
- TextMate grammar for syntax highlighting
- Language configuration for brackets and comments