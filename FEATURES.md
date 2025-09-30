# VintLang Extension - Modern LSP Features Showcase

This document showcases all the modern Language Server Protocol features implemented in the VintLang VS Code extension.

## 📋 Table of Contents

1. [Enhanced Diagnostics](#enhanced-diagnostics)
2. [Code Actions & Quick Fixes](#code-actions--quick-fixes)
3. [Semantic Highlighting](#semantic-highlighting)
4. [Inlay Hints](#inlay-hints)
5. [Rename Refactoring](#rename-refactoring)
6. [Navigation Features](#navigation-features)
7. [Call Hierarchy](#call-hierarchy)
8. [Signature Help](#signature-help)
9. [Document Links](#document-links)
10. [Selection Ranges](#selection-ranges)
11. [Code Lens](#code-lens)
12. [Color Decorators](#color-decorators)
13. [New Built-in Functions](#new-built-in-functions)
    - [File I/O Functions](#file-io-functions)
    - [Enhanced Math Functions](#enhanced-math-functions)
    - [Utility Functions](#utility-functions)
    - [Advanced String Functions](#advanced-string-functions)
    - [Functional Array Operations](#functional-array-operations)
    - [Type Checking Functions](#type-checking-functions)
    - [Advanced Math Functions](#advanced-math-functions)

---

## Enhanced Diagnostics

### Symbol Table & Unused Detection

The extension tracks all symbols (functions, variables, imports) and detects unused declarations:

```vint
import time  // ✅ Used - no warning

let unusedVar = "hello"  // ⚠️ Hint: Variable 'unusedVar' is declared but never used

let usedVar = "world"
print(usedVar)  // ✅ No warning - variable is used

let unusedFunc = func() {  // ⚠️ Hint: Function 'unusedFunc' is declared but never used
    return 42
}

let mainFunc = func() {  // ✅ Used - no warning
    print("Hello")
}
mainFunc()
```

### Diagnostic Codes

All diagnostics include codes for identification:

```vint
x = 5  // ⚠️ [missing-let] Consider using 'let' to declare variable 'x'

func myFunc() {  // ❌ [invalid-function-syntax] Function should be declared as 'let name = func()'
    print("test")
}

if (true) {
    print("test")
}}  // ❌ [unmatched-brace] Unmatched closing brace
```

---

## Code Actions & Quick Fixes

### Add 'let' Quick Fix

```vint
// Before quick fix:
name = "John"  // 💡 Quick fix available

// After applying "Add 'let' to declare variable":
let name = "John"
```

### Remove Unused Declaration

```vint
// Before quick fix:
let unused = 42  // 💡 Quick fix available
let used = 10
print(used)

// After applying "Remove unused declaration":
let used = 10
print(used)
```

### Documentation Link

```vint
func test() {  // 💡 Quick fix available
    print("error")
}

// Quick fix: "Learn about VintLang function syntax"
// Opens: https://vintlang.ekilie.com/docs/functions
```

---

## Semantic Highlighting

The extension provides 22 different token types for accurate syntax highlighting:

```vint
// Keywords (control flow)
if (condition) {
    for item in array {
        while (true) {
            break
        }
    }
}

// Built-in functions (highlighted as default library)
print("text")
println("line")
len(array)
range(0, 10)

// User-defined functions (different from built-ins)
let myFunction = func(param) {
    return param + 1
}

// Modules (namespace highlighting)
import time
import net
let now = time.now()

// Literals
let str = "string"
let num = 42
let float = 3.14
let bool = true

// Operators
let result = x + y * z

// Declarative statements (special highlighting)
todo "Implement this"
warn "Deprecated"
error "Critical issue"

// Comments
// Line comment
/* Block comment */
```

---

## Inlay Hints

### Parameter Name Hints

```vint
// Function call with parameter hints displayed inline:
convert("123", "INTEGER")
//      ↑value ↑type    (hints shown in editor)

split("a,b,c", ",")
//    ↑string  ↑delimiter

range(0, 10, 2)
//    ↑start ↑end ↑step
```

### Type Inference Hints

```vint
let name = "John"     // : string (hint shown after variable name)
let age = 25          // : int
let pi = 3.14         // : float
let active = true     // : bool
let items = [1, 2, 3] // : array
let data = { a: 1 }   // : map
let calc = func() {}  // : function
```

---

## Rename Refactoring

Safe symbol renaming across your codebase:

```vint
// Before rename (cursor on 'oldName'):
let oldName = func(x) {
    return x * 2
}

let result1 = oldName(5)
let result2 = oldName(10)
print(oldName(15))

// After renaming to 'double' (F2):
let double = func(x) {
    return x * 2
}

let result1 = double(5)
let result2 = double(10)
print(double(15))

// All references automatically updated!
```

---

## Navigation Features

### Go to Definition

```vint
let calculate = func(x, y) {
    return x + y
}

// Ctrl+Click or F12 on 'calculate' jumps to definition
let result = calculate(5, 10)
         //  ^^^^^^^^^ Press F12 here
```

### Find All References

```vint
let globalVar = 42

let func1 = func() {
    print(globalVar)  // Reference 1
}

let func2 = func() {
    return globalVar + 10  // Reference 2
}

// Right-click 'globalVar' → "Find All References"
// Shows all 3 locations (definition + 2 uses)
```

### Document Highlight

```vint
let counter = 0

let increment = func() {
    counter = counter + 1  // Automatically highlights all 'counter'
//  ^^^^^^^ Click here
}

let reset = func() {
    counter = 0  // This is highlighted too
}
```

---

## Call Hierarchy

Visualize function call relationships:

```vint
let helper = func() {
    print("helper")
}

let process = func() {
    helper()  // Outgoing call
    return 42
}

let main = func() {
    process()  // Outgoing call
    helper()   // Outgoing call
}

main()

// Right-click 'process' → "Show Call Hierarchy"
// 
// Incoming Calls:
//   ↓ main (called by)
//
// Outgoing Calls:
//   → helper (calls)
```

---

## Signature Help

Parameter hints while typing function calls:

```vint
// As you type, signature help appears:

convert(
//      ↑ Shows: convert(value, type)
//               ^^^^^ active parameter highlighted

split("text",
//           ↑ Shows: split(string, delimiter)
//                          ^^^^^^ active parameter

range(0, 10,
//          ↑ Shows: range(start, end, [step])
//                               ^^^ active parameter
```

Available for: `print`, `println`, `type`, `convert`, `len`, `range`, `split`, `join`

---

## Document Links

### Import Links

```vint
// Hover over module names to see links:
import time   // ← Ctrl+Click opens: https://vintlang.ekilie.com/docs/modules/time
import net    // ← Ctrl+Click opens: https://vintlang.ekilie.com/docs/modules/net
import json   // ← Ctrl+Click opens: https://vintlang.ekilie.com/docs/modules/json
```

### URL Links

```vint
// URLs in comments are automatically clickable:

// See documentation: https://vintlang.ekilie.com/docs
//                    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ Ctrl+Click to open

/* 
 * API Reference: https://api.example.com
 *                ^^^^^^^^^^^^^^^^^^^^^^^ Clickable link
 */
```

---

## Selection Ranges

Smart expand/shrink selection (Alt+Shift+Left/Right):

```vint
let fibonacci = func(n) {
    if (n <= 1) {
        return n
    }
    return fibonacci(n-1) + fibonacci(n-2)
}

// Place cursor on 'fibonacci' inside if block:
// 1st expand: 'fibonacci' (word)
// 2nd expand: 'return fibonacci(n-1) + fibonacci(n-2)' (line)
// 3rd expand: entire if-else block
// 4th expand: entire function body
```

---

## Workspace Features

### Workspace Symbol Search

Search for symbols across all files in workspace:

```vint
// In file1.vint:
let globalFunction = func() {
    return 42
}

// In file2.vint:
let helperFunction = func() {
    return "test"
}

// Press Ctrl+T and type 'func'
// Shows both functions with file locations
```

---

## Code Lens

**NEW in v0.5.0** - Code lens provides inline actionable information above functions.

### Reference Counts

The extension shows how many times each function is called:

```vint
let greet = func(name) {  // Shows: "2 references" above the function
    println("Hello, " + name)
}

greet("Alice")
greet("Bob")
```

### Features

- **Automatic Counting** - Counts all function calls across the document
- **Click to Navigate** - Click the code lens to see all references
- **Real-time Updates** - Updates automatically as you code
- **Configuration** - Toggle via `vintlang.codeLens.enable` setting

---

## Color Decorators

**NEW in v0.5.0** - Visual decorators for color values in your code.

### Supported Formats

The extension recognizes and decorates multiple color formats:

```vint
// Hex colors
let primary = "#FF5733"      // Full hex (6 digits)
let accent = "#f00"          // Short hex (3 digits)

// RGB colors
let background = "rgb(255, 255, 255)"
let foreground = "rgb(33, 33, 33)"

// RGBA colors with transparency
let overlay = "rgba(0, 0, 0, 0.5)"
```

### Features

- **Visual Preview** - See the actual color inline next to the value
- **Color Picker** - Click to edit colors with VS Code's built-in color picker
- **Format Conversion** - Convert between hex, RGB, and RGBA formats
- **Real-time Updates** - Changes reflect immediately in decorators
- **Configuration** - Toggle via `vintlang.colorDecorators.enable` setting

---

## New Built-in Functions

**NEW in v0.5.0** - Extended built-in function library.

### File I/O Functions

Comprehensive file system operations:

```vint
// Read file contents
let config = readFile("config.json")

// Write to file
writeFile("output.txt", "Hello, World!")

// Append to file
appendFile("log.txt", "New entry\n")

// Check if file exists
if (fileExists("data.txt")) {
    println("File found!")
}

// Delete file
deleteFile("temp.txt")

// Directory operations
let files = readDir("./src")
makeDir("output")
```

**Available Functions:**
- `readFile(path)` - Read file contents as string
- `writeFile(path, content)` - Write content to file
- `appendFile(path, content)` - Append to existing file
- `deleteFile(path)` - Delete a file
- `fileExists(path)` - Check if file exists
- `readDir(path)` - List directory contents
- `makeDir(path)` - Create directory

### Enhanced Math Functions

Advanced mathematical operations:

```vint
// Trigonometric functions (radians)
let s = sin(3.14159 / 4)    // 45 degrees
let c = cos(0)
let t = tan(0.785398)

// Logarithmic and exponential
let ln = log(10)            // Natural log
let e = exp(2)              // e^2

// Number formatting
let formatted = toFixed(3.14159, 2)  // "3.14"

// Parsing
let num = parseInt("42")
let decimal = parseFloat("3.14")
```

**Available Functions:**
- `sin(x)`, `cos(x)`, `tan(x)` - Trigonometric functions
- `log(x)` - Natural logarithm
- `exp(x)` - Exponential (e^x)
- `toFixed(number, digits)` - Format to fixed decimals
- `parseInt(string)` - Parse integer from string
- `parseFloat(string)` - Parse float from string

### Utility Functions

Helpful utilities for common operations:

```vint
// Map operations
let user = {"name": "John", "age": 30}

let userKeys = keys(user)        // ["name", "age"]
let userValues = values(user)    // ["John", 30]
let userEntries = entries(user)  // [["name", "John"], ["age", 30]]

// Merge maps
let defaults = {"theme": "dark"}
let settings = {"theme": "light", "fontSize": 14}
let merged = merge(defaults, settings)  // {"theme": "light", "fontSize": 14}

// Deep cloning
let original = {"data": [1, 2, 3]}
let copy = clone(original)

// Object protection
freeze(constants)  // Prevent modifications
seal(config)       // Prevent adding properties
```

**Available Functions:**
- `keys(map)` - Get array of map keys
- `values(map)` - Get array of map values
- `entries(map)` - Get array of [key, value] pairs
- `merge(map1, map2)` - Merge two maps (map2 overwrites)
- `clone(value)` - Deep copy of any value
- `freeze(object)` - Freeze object to prevent changes
- `seal(object)` - Seal object to prevent new properties

### Advanced String Functions

Extended string manipulation capabilities:

```vint
let text = "Hello, World!"

// Substring extraction
let hello = substring(text, 0, 5)  // "Hello"

// Finding substrings
let pos = indexOf(text, "World")       // 7
let lastPos = lastIndexOf(text, "o")   // 8

// Character access
let firstChar = charAt(text, 0)        // "H"
let charCode = charCodeAt(text, 0)     // 72

// String padding
let padded1 = padStart("5", 3, "0")    // "005"
let padded2 = padEnd("Hi", 5, "!")     // "Hi!!!"

// Repetition
let repeated = repeat("Ha", 3)         // "HaHaHa"
```

**Available Functions:**
- `substring(string, start, end)` - Extract substring between indices
- `indexOf(string, searchValue)` - Find first occurrence index
- `lastIndexOf(string, searchValue)` - Find last occurrence index
- `charAt(string, index)` - Get character at position
- `charCodeAt(string, index)` - Get Unicode value of character
- `padStart(string, length, padString)` - Pad from start
- `padEnd(string, length, padString)` - Pad from end
- `repeat(string, count)` - Repeat string n times

### Functional Array Operations

Modern functional programming methods for arrays:

```vint
let numbers = [1, 2, 3, 4, 5]

// Transform elements
let doubled = map(numbers, func(x) { return x * 2 })  // [2, 4, 6, 8, 10]

// Filter elements
let evens = filter(numbers, func(x) { return x % 2 == 0 })  // [2, 4]

// Reduce to single value
let sum = reduce(numbers, func(acc, x) { return acc + x }, 0)  // 15

// Find elements
let found = find(numbers, func(x) { return x > 3 })      // 4
let index = findIndex(numbers, func(x) { return x > 3 })  // 3

// Check inclusion
let hasThree = includes(numbers, 3)  // true

// Iterate
forEach(numbers, func(x) { println(x) })
```

**Available Functions:**
- `map(array, function)` - Transform each element
- `filter(array, function)` - Keep elements that pass test
- `reduce(array, function, initialValue)` - Reduce to single value
- `find(array, function)` - Find first matching element
- `findIndex(array, function)` - Find first matching index
- `includes(array, value)` - Check if array contains value
- `forEach(array, function)` - Execute function for each element

### Type Checking Functions

Runtime type validation utilities:

```vint
let value = "Hello"

// Type checks
if (isString(value)) {
    println("It's a string!")
}

if (isNumber(42)) {
    println("It's a number!")
}

if (isArray([1, 2, 3])) {
    println("It's an array!")
}

if (isMap({"key": "value"})) {
    println("It's a map!")
}

if (isNull(null)) {
    println("It's null!")
}

if (isBool(true)) {
    println("It's a boolean!")
}
```

**Available Functions:**
- `isString(value)` - Check if value is a string
- `isNumber(value)` - Check if value is a number
- `isArray(value)` - Check if value is an array
- `isMap(value)` - Check if value is a map/object
- `isNull(value)` - Check if value is null
- `isBool(value)` - Check if value is a boolean

### Advanced Math Functions

Additional mathematical operations:

```vint
// Inverse trigonometric functions
let angle1 = asin(0.5)  // Arc sine: ~0.524 radians (30 degrees)
let angle2 = acos(0.5)  // Arc cosine: ~1.047 radians (60 degrees)
let angle3 = atan(1)    // Arc tangent: ~0.785 radians (45 degrees)

// Calculate angle from coordinates
let angle = atan2(1, 1)  // ~0.785 radians (45 degrees)

// Cube root
let cubeRoot = cbrt(27)  // 3
```

**Available Functions:**
- `asin(x)` - Arc sine (inverse sine)
- `acos(x)` - Arc cosine (inverse cosine)
- `atan(x)` - Arc tangent (inverse tangent)
- `atan2(y, x)` - Angle from coordinates
- `cbrt(x)` - Cube root

---

## Configuration

Control features via settings:

```json
{
    // Enable/disable features
    "vintlang.enable": true,
    "vintlang.diagnostics.enable": true,
    "vintlang.completion.enable": true,
    "vintlang.format.enable": true,
    
    // Modern features
    "vintlang.inlayHints.enable": true,
    "vintlang.semanticHighlighting.enable": true,
    "vintlang.codeActions.enable": true,
    "vintlang.codeLens.enable": true,
    "vintlang.colorDecorators.enable": true,
    
    // Debug
    "vintlang.trace.server": "off",  // or "messages", "verbose"
    "vintlang.maxNumberOfProblems": 100
}
```

---

## Status Bar

The status bar shows extension status:

- **$(check) VintLang Active** - Server running normally
- **$(sync~spin) VintLang Restarting...** - Server restarting
- **$(alert) VintLang Stopped** - Server stopped
- **$(alert) VintLang Error** - Extension error

Click the status bar item to:
- View detailed status
- Open settings
- Restart server

---

## Tips & Tricks

### Keyboard Shortcuts

- **F12** - Go to Definition
- **Shift+F12** - Find All References  
- **F2** - Rename Symbol
- **Ctrl+Space** - Trigger Completion
- **Ctrl+Shift+O** - Go to Symbol in File
- **Ctrl+T** - Go to Symbol in Workspace
- **Alt+Shift+F** - Format Document
- **Alt+Shift+Left/Right** - Shrink/Expand Selection
- **Ctrl+K Ctrl+I** - Show Hover Information

### Command Palette

Press **Ctrl+Shift+P** and type "VintLang" to see all commands:
- VintLang: Restart Language Server
- VintLang: Show Extension Status
- VintLang: Show References

---

## Performance Notes

All features are optimized for performance:

- **Symbol Table**: Built once per document update, cached
- **Semantic Tokens**: Efficient builder pattern, minimal regex
- **Diagnostics**: Two-pass analysis, incremental updates
- **References**: Fast text-based search with word boundary matching
- **Memory**: Document-specific caches, automatic cleanup

---

## Troubleshooting

### Features Not Working?

1. Check extension is active: Look for status bar item
2. Verify file extension: Must be `.vint`
3. Check settings: Ensure features are enabled
4. Restart server: Command Palette → "VintLang: Restart Language Server"
5. Check output: View → Output → "VintLang Language Server"

### Enable Verbose Logging

```json
{
    "vintlang.trace.server": "verbose"
}
```

Then check Output panel for detailed logs.

---

**Enjoy the modern LSP features! 🚀**
