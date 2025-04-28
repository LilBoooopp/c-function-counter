# C Function Counter

A Visual Studio Code extension that counts the number of function definitions in C files and displays the count directly in the Explorer view.

## Features

- Automatically counts functions in all C files in your workspace
- Updates counts when files are modified
- Displays function counts as badges next to file names in the Explorer
- Handles various C function definition patterns

![Function Count Demo](images/demo.png)

## How It Works

The extension scans C files using pattern matching to identify function definitions. The count appears as a badge next to each C file in the Explorer view, making it easy to see the function count at a glance.

## Requirements

- Visual Studio Code 1.60.0 or higher

## Extension Settings

This extension has no configurable settings at this time.

## Known Issues

- The current function detection uses regex pattern matching, which may not catch all edge cases in complex C code
- Function declarations in preprocessor macros might cause false positives

## Release Notes

### 0.1.0

- Initial release
- Basic function counting for C files
- Explorer integration with badge display

---

## Development

### Building the Extension

1. Clone the repository
2. Run `npm install` to install dependencies
3. Press F5 to launch the extension in debug mode

### Packaging

```bash
npm install -g vsce
vsce package
```

This will generate a `.vsix` file that can be installed in VS Code.

---

**Enjoy!**