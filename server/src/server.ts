/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import {
  createConnection,
  TextDocuments,
  ProposedFeatures,
  InitializeParams,
  DidChangeConfigurationNotification,
  CompletionItem,
  TextDocumentPositionParams,
  WorkspaceSymbolParams,
  SymbolInformation,
  DocumentSymbolParams,
  DocumentFilter,
  DocumentSymbol,
  Definition,
  SymbolKind
} from "vscode-languageserver";
import { IDL } from "./providers/idl";

const IDL_MODE: DocumentFilter = { language: "idl", scheme: "file" };

// Create a connection for the server. The connection uses Node's IPC as a transport.
// Also include all preview / proposed LSP features.
let connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager. The text document manager
// supports full document sync only
let documents: TextDocuments = new TextDocuments();

// create our IDL provider object, which is the object-entry for everything so
// we can test functionality with object methods rather than APIs
const idl = new IDL(documents, connection)

// flags for configuration
let hasConfigurationCapability: boolean = false;
let hasWorkspaceFolderCapability: boolean = true;
let hasDiagnosticRelatedInformationCapability: boolean = false;

connection.onInitialize((params: InitializeParams) => {
  let capabilities = params.capabilities;

  // Does the client support the `workspace/configuration` request?
  // If not, we will fall back using global settings
  hasConfigurationCapability = !!(
    capabilities.workspace && !!capabilities.workspace.configuration
  );
  hasWorkspaceFolderCapability = !!(
    capabilities.workspace && !!capabilities.workspace.workspaceFolders
  );
  hasDiagnosticRelatedInformationCapability = !!(
    capabilities.textDocument &&
    capabilities.textDocument.publishDiagnostics &&
    capabilities.textDocument.publishDiagnostics.relatedInformation
  );

  return {
    capabilities: {
      textDocumentSync: documents.syncKind,
      // Tell the client that the server supports code completion
      completionProvider: {
        resolveProvider: true
      },
      definitionProvider: true,
      workspaceSymbolProvider: true,
      documentSymbolProvider: true
    }
  };
});

connection.onInitialized(async () => {
  if (hasConfigurationCapability) {
    // Register for all configuration changes.
    connection.client.register(
      DidChangeConfigurationNotification.type,
      undefined
    );
  }

  // listen for workspace folder event changes and update our serve-side cache
  // TODO: detect when workspace is closed and remove files
  if (hasWorkspaceFolderCapability) {
    // get the list of current workspaces
    connection.workspace
      .getWorkspaceFolders()
      .then(
        async folders => {
          // refresh our index and detect problems on success
          await idl.manager.indexWorkspaces(folders)

          // find problems
          idl.problems.detectAndSendProblems();
        },
        rejected => {
          connection.console.log(JSON.stringify(rejected));
        }
      )
      .then(undefined, rejected => {
        connection.console.log(JSON.stringify(rejected));
      });

    connection.workspace.connection.workspace // listen for new workspaces
      .onDidChangeWorkspaceFolders(async _event => {
        connection.console.log(
          "Workspace folder change event received. " + JSON.stringify(_event)
        );

        // refresh our index and detect problems on success
        await idl.manager.indexWorkspaces(_event.added)

        // find problems
        idl.problems.detectAndSendProblems();
      });
  }
});

// The example settings
interface ExampleSettings {
  maxNumberOfProblems: number;
}

// The global settings, used when the `workspace/configuration` request is not supported by the client.
// Please note that this is not the case when using this server with the client provided in this example
// but could happen with other clients.
const defaultSettings: ExampleSettings = { maxNumberOfProblems: 1000 };
let globalSettings: ExampleSettings = defaultSettings;

// Cache the settings of all open documents
let documentSettings: Map<string, Thenable<ExampleSettings>> = new Map();

connection.onDidChangeConfiguration(change => {
  if (hasConfigurationCapability) {
    // Reset all cached document settings
    documentSettings.clear();
  } else {
    globalSettings = <ExampleSettings>(
      (change.settings.languageServerExample || defaultSettings)
    );
  }

  // Revalidate all open text documents
  idl.problems.detectAndSendProblems();
});

function getDocumentSettings(resource: string): Thenable<ExampleSettings> {
  if (!hasConfigurationCapability) {
    return Promise.resolve(globalSettings);
  }
  let result = documentSettings.get(resource);
  if (!result) {
    result = connection.workspace.getConfiguration({
      scopeUri: resource,
      section: "IDLLanguageServer"
    });
    documentSettings.set(resource, result);
  }
  return result;
}

connection.onDidChangeWatchedFiles(_change => {
  // Monitored files have change in VSCode
  connection.console.log("We received an file change event");
});

// This handler provides the initial list of the completion items.
connection.onCompletion(
  (_textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
    // get the word that we are trying to complete
    // do this here just so we dont have to split larger files more than once
    // because we need the strings, split, and regex to find our work
    const query = idl.manager.getSelectedSymbolName(_textDocumentPosition)[0]

    // get docs matches
    let docsMatches = idl.helper.completion(query)

    // get symbol matches
    const symMatches = idl.manager.completion(query, _textDocumentPosition)
    if (symMatches.length > 0) {
      docsMatches = docsMatches.concat(symMatches)
    }

    return docsMatches
  }
);

// when we auto complete, do any custom adjustments to the data before the auto-complete
// request gets back to the client
connection.onCompletionResolve(
  (item: CompletionItem): CompletionItem => {
    return idl.helper.postCompletion(item);
  }
);

// handle when a user searches for a symbol
connection.onWorkspaceSymbol(
  (params: WorkspaceSymbolParams): SymbolInformation[] => {
    return idl.manager.searchByName(params.query);
  }
);

// handle when we want the definition of a symbol
connection.onDefinition(
  (params: TextDocumentPositionParams): Definition => {
    const res = idl.manager.searchByLine(params, true);
    return res;
  }
);

// connection.onHover(
//   (params: TextDocumentPositionParams): Hover => {
//     const res = idl.manager.searchByLine(params);
//     return res;
//   }
// )

// handle when we request document symbols
connection.onDocumentSymbol(
  async (
    params: DocumentSymbolParams
  ): Promise<SymbolInformation[] | DocumentSymbol[]> => {
    return (await idl.manager.get.documentSymbols(
      params.textDocument.uri
    )).filter(symbol => { return symbol.kind !== SymbolKind.Variable }).map(symbol => {
      return {
        name: symbol.displayName,
        detail: symbol.detail,
        kind: symbol.kind,
        range: symbol.range,
        selectionRange: symbol.selectionRange,
        children: symbol.children
      };
    });
  }
);

/*
connection.onDidOpenTextDocument((params) => {
	// A text document got opened in VSCode.
	// params.uri uniquely identifies the document. For documents store on disk this is a file URI.
	// params.text the initial full content of the document.
	connection.console.log(`${params.textDocument.uri} opened.`);
});
connection.onDidChangeTextDocument((params) => {
	// The content of a text document did change in VSCode.
	// params.uri uniquely identifies the document.
	// params.contentChanges describe the content changes to the document.
	connection.console.log(`${params.textDocument.uri} changed: ${JSON.stringify(params.contentChanges)}`);
});
connection.onDidCloseTextDocument((params) => {
	// A text document got closed in VSCode.
	// params.uri uniquely identifies the document.
	connection.console.log(`${params.textDocument.uri} closed.`);
});
*/

// listen for changing documents
// Only keep settings for open documents
documents.onDidClose(e => {
  documentSettings.delete(e.document.uri);
});

// TODO: work with just the changed parts of a document
// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent(async change => {
  // generate new symbols with the update, seems to magically sync when there are changes?
  const newSymbols = await idl.manager.update(change.document.uri);

  // detect problems because we had change
  idl.problems.detectAndSendProblems();
});

documents.onDidOpen(async event => {
  await idl.manager.get.documentSymbols(event.document.uri);

  // detect problems because we had change
  idl.problems.detectAndSendProblems();
});

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();
