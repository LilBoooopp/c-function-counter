const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

const fileDecorations = new Map();
let decorationProvider;

const emitter = new vscode.EventEmitter();

/**
 * @brief Parses C file content and counts function definitions more accurately.
 * @param {string} content - The content of the C file.
 * @param {number} - The number of functions.
 */
function countFunctionsInC(content) {
    let cleaned = content
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove /* comments */
        .replace(/\/\/.*$/gm, '')         // Remove // comments
        .replace(/"(?:\\.|[^"\\])*"/g, '') // Remove string literals
        .replace(/'(?:\\.|[^'\\])*'/g, ''); // Remove character literals

    // Step 2: Remove preprocessor directives
    cleaned = cleaned.replace(/^\s*#.*$/gm, '');

    // Step 3: Normalize whitespace
    cleaned = cleaned.replace(/\s+/g, ' ');

    // Step 4: Match possible function definitions
    const functionRegex = /\b(?:[a-zA-Z_][a-zA-Z0-9_]*\s+)+\**\s*[a-zA-Z_][a-zA-Z0-9_]*\s*\([^)]*\)\s*\{/g;

    const matches = cleaned.match(functionRegex) || [];
    return matches.length;
}

/**
 * Updates the function count decoration for a given file URI.
 * @param {vscode.Uri} uri - The URI of the file to update.
 */
async function updateDecorationForFile(uri) {
    if (path.extname(uri.fsPath) !== '.c') {
        fileDecorations.delete(uri.toString());
        if (decorationProvider) {
            emitter.fire(uri);
        }
        return;
    }

    try {
        const content = await fs.promises.readFile(uri.fsPath, 'utf8');
        const functionCount = countFunctionsInC(content);
        fileDecorations.set(uri.toString(), functionCount);
        if (decorationProvider) {
            emitter.fire(uri);
        }
    } catch (error) {
        console.error('Error updating decoration for:', uri.fsPath, error);
        fileDecorations.delete(uri.toString());
        if (decorationProvider) {
            emitter.fire(uri);
        }
    }
}

/**
 * Provides file decorations for the Explorer view.
 */
const fileDecorationProvider = {
    provideFileDecoration: (uri) => {
        const count = fileDecorations.get(uri.toString());
        if (count !== undefined) {
            return {
                badge: `${count}`,
                tooltip: `${count} function(s)`
            };
        }
        return undefined;
    },
    onDidChangeFileDecorations: emitter.event
};

/**
 * Extension activation
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {
    console.log('Congratulations, your extension "c-function-counter" is now active!');

    // Register the command (still useful for manual triggers if needed)
    let disposable = vscode.commands.registerCommand('c-function-counter.countFunctions', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            updateDecorationForFile(editor.document.uri);
        }
    });
    context.subscriptions.push(disposable);

    // Register the file decoration provider only once
    decorationProvider = vscode.window.registerFileDecorationProvider(fileDecorationProvider);
    context.subscriptions.push(decorationProvider);

    // Initialize decorations for all currently open C files
    if (vscode.workspace.workspaceFolders) {
        for (const folder of vscode.workspace.workspaceFolders) {
            const pattern = new vscode.RelativePattern(folder, '**/*.c');
            const files = await vscode.workspace.findFiles(pattern);
            files.forEach(updateDecorationForFile);
        }
    }

    // Set up file system watcher for changes, creations, and deletions
    const watcher = vscode.workspace.createFileSystemWatcher('**/*.c');
    watcher.onDidChange(uri => updateDecorationForFile(uri));
    watcher.onDidCreate(uri => updateDecorationForFile(uri));
    watcher.onDidDelete(uri => {
        fileDecorations.delete(uri.toString());
        if (decorationProvider) {
            emitter.fire(uri);
        }
    });
    context.subscriptions.push(watcher);

    // Handle active editor changes to update decoration if a C file becomes active
    vscode.window.onDidChangeActiveTextEditor(editor => {
        if (editor && editor.document.languageId === 'c') {
            updateDecorationForFile(editor.document.uri);
        }
    });
}

/**
 * Extension deactivation
 */
function deactivate() {}

module.exports = {
    activate,
    deactivate
};