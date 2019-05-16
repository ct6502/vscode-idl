"use strict";
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const vscode_1 = require("vscode");
const vscode = require("vscode");
const vscode_languageclient_1 = require("vscode-languageclient");
const idl_tree_view_1 = require("./providers/idl-tree-view");
let client;
const IDL_MODE = { language: "idl", scheme: "file" };
function activate(ctx) {
    // The server is implemented in node
    let serverModule = ctx.asAbsolutePath(path.join("server", "dist", "server.js"));
    // The debug options for the server
    // --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging
    let debugOptions = { execArgv: ["--nolazy", "--inspect=6009"] };
    // If the extension is launched in debug mode then the debug server options are used
    // Otherwise the run options are used
    let serverOptions = {
        run: { module: serverModule, transport: vscode_languageclient_1.TransportKind.ipc },
        debug: {
            module: serverModule,
            transport: vscode_languageclient_1.TransportKind.ipc,
            options: debugOptions
        }
    };
    // Options to control the language client
    let clientOptions = {
        // Register the server for plain text documents
        documentSelector: [{ scheme: "file", language: "idl" }],
        synchronize: {
            // Notify the server about file changes to '.clientrc files contained in the workspace
            fileEvents: vscode_1.workspace.createFileSystemWatcher("**/.idlrc")
        }
    };
    // Create the language client and start the client.
    client = new vscode_languageclient_1.LanguageClient("IDLLanguageServer", "IDL Language Server", serverOptions, clientOptions);
    // add some buttons
    // Samples of `window.registerTreeDataProvider`
    const idlTreeProvider = new idl_tree_view_1.IDLTreeViewProvider(vscode.workspace.rootPath);
    const treeView = vscode.window.createTreeView("idlTree", {
        treeDataProvider: idlTreeProvider
    });
    // listen for when we click on items in the tree view
    treeView.onDidChangeSelection(event => {
        // get the selected item
        const item = event.selection[0];
        // determine what to do, ignore parent requests
        switch (true) {
            case item.contextValue === "child":
                vscode.window.showInformationMessage(`Clicked on code action ${event.selection[0].label}.`);
                break;
            default:
            // do nothing
        }
    });
    // Start the client. This will also launch the server
    client.start();
}
exports.activate = activate;
function deactivate() {
    if (!client) {
        return undefined;
    }
    return client.stop();
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map