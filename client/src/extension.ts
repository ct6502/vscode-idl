/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as path from "path";
import { workspace, ExtensionContext, DocumentFilter } from "vscode";
import * as vscode from "vscode";

import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind
} from "vscode-languageclient";
import { IDLTreeViewProvider } from "./providers/idl-tree-view";
import { IDLTreeClickHandler } from "./providers/idl-tree-click-handler";

let client: LanguageClient;

const IDL_MODE: DocumentFilter = { language: "idl", scheme: "file" };

export function activate(ctx: ExtensionContext) {
  // The server is implemented in node
  let serverModule = ctx.asAbsolutePath(
    path.join("server", "dist", "server.js")
  );

  // The debug options for the server
  // --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging
  let debugOptions = { execArgv: ["--nolazy", "--inspect=6009"] };

  // If the extension is launched in debug mode then the debug server options are used
  // Otherwise the run options are used
  let serverOptions: ServerOptions = {
    run: { module: serverModule, transport: TransportKind.ipc },
    debug: {
      module: serverModule,
      transport: TransportKind.ipc,
      options: debugOptions
    }
  };

  // Options to control the language client
  let clientOptions: LanguageClientOptions = {
    // Register the server for plain text documents
    documentSelector: [{ scheme: "file", language: "idl" }],
    synchronize: {
      // Notify the server about file changes to '.clientrc files contained in the workspace
      fileEvents: workspace.createFileSystemWatcher("**/.idlrc")
    }
  };

  // Create the language client and start the client.
  client = new LanguageClient(
    "IDLLanguageServer",
    "IDL Language Server",
    serverOptions,
    clientOptions
  );

  // create our click handler
  const clickHandler = new IDLTreeClickHandler();

  // generate our tree provider and get the view for listening to events
  const idlTreeProvider = new IDLTreeViewProvider(vscode.workspace.rootPath);
  const treeView = vscode.window.createTreeView("idlTree", {
    treeDataProvider: idlTreeProvider
  });

  // listen for when we click on items in the tree view
  treeView.onDidChangeSelection(event => {
    // handle our click event
    clickHandler.clickedItem(event.selection[0]);
    // treeView.reveal(event.selection[0], { select: false, focus: false });

    idlTreeProvider
      .getChildren()
      .then(
        kids => {
          treeView
            .reveal(kids[0], { select: true })
            .then(undefined, rejectReveal => console.log(rejectReveal))
            .then(undefined, rejectReveal => {
              console.log(rejectReveal);
            });
        },
        (rejected: any) => {
          console.log(rejected);
        }
      )
      .then(undefined, (rejected: any) => {
        console.log(rejected);
      });
  });

  // Start the client. This will also launch the server
  client.start();
}

export function deactivate(): Thenable<void> | undefined {
  if (!client) {
    return undefined;
  }
  return client.stop();
}
