import {
  CompletionItem,
  createConnection,
  Definition,
  DidChangeConfigurationNotification,
  DocumentFilter,
  DocumentSymbol,
  DocumentSymbolParams,
  FileChangeType,
  Hover,
  InitializeParams,
  ProposedFeatures,
  SymbolInformation,
  TextDocumentPositionParams,
  TextDocuments,
  WorkspaceSymbolParams
} from 'vscode-languageserver';
import { IDL } from './providers/idl';
import { DEFAULT_SERVER_SETTINGS, IServerSettings } from './server.interface';

const IDL_MODE: DocumentFilter = { language: 'idl', scheme: 'file' };

// Create a connection for the server. The connection uses Node's IPC as a transport.
// Also include all preview / proposed LSP features.
const connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager. The text document manager
// supports full document sync only
const documents: TextDocuments = new TextDocuments();

// create our IDL provider object, which is the object-entry for everything so
// we can test functionality with object methods rather than APIs
const idl = new IDL(documents, connection);

// flags for configuration
let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = true;
let hasDiagnosticRelatedInformationCapability = false;

connection.onInitialize((params: InitializeParams) => {
  const capabilities = params.capabilities;

  // Does the client support the `workspace/configuration` request?
  // If not, we will fall back using global settings
  hasConfigurationCapability = !!(capabilities.workspace && !!capabilities.workspace.configuration);
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
      documentSymbolProvider: true,
      hoverProvider: true
    }
  };
});

connection.onInitialized(() => {
  if (hasConfigurationCapability) {
    // Register for all configuration changes.
    connection.client.register(DidChangeConfigurationNotification.type, undefined);
  }

  // listen for workspace folder event changes and update our serve-side cache
  // TODO: detect when workspace is closed and remove files
  if (hasWorkspaceFolderCapability) {
    // get the list of current workspaces
    connection.workspace
      .getWorkspaceFolders()
      .then(
        async folders => {
          await idl.indexWorkspaces(folders, true);
        },
        rejected => {
          connection.console.log(JSON.stringify(rejected));
        }
      )
      .then(undefined, rejected => {
        connection.console.log(JSON.stringify(rejected));
      });

    // listen for new workspaces
    connection.workspace.onDidChangeWorkspaceFolders(async _event => {
      // remove workspaces
      await idl.removeWorkspaces(_event.removed);

      // add new folders
      await idl.indexWorkspaces(_event.added, true);
    });
  }
});

// Cache the settings of all open documents
const documentSettings: Map<string, Thenable<IServerSettings>> = new Map();

// The global settings, used when the `workspace/configuration` request is not supported by the client.
// Please note that this is not the case when using this server with the client provided in this example
// but could happen with other clients.
let globalSettings: IServerSettings = { ...DEFAULT_SERVER_SETTINGS };

// check for configuration changes
connection.onDidChangeConfiguration(change => {
  if (hasConfigurationCapability) {
    // Reset all cached document settings
    documentSettings.clear();
  } else {
    globalSettings = (change.settings.languageServerExample || {
      ...DEFAULT_SERVER_SETTINGS
    }) as IServerSettings;
  }

  // Revalidate all open text documents
  idl.detectProblems(true);
});

function getDocumentSettings(resource: string): Thenable<IServerSettings> {
  if (!hasConfigurationCapability) {
    return Promise.resolve(globalSettings);
  }
  let result = documentSettings.get(resource);
  if (!result) {
    result = connection.workspace.getConfiguration({
      scopeUri: resource,
      section: 'IDLLanguageServer'
    });
    documentSettings.set(resource, result);
  }
  return result;
}

connection.onDidChangeWatchedFiles(async _change => {
  // process each change
  for (let i = 0; i < _change.changes.length; i++) {
    const change = _change.changes[i];
    switch (change.type) {
      case FileChangeType.Created:
        await idl.addDocumentSymbols(change.uri);
        break;
      case FileChangeType.Deleted:
        await idl.removeDocumentSymbols(change.uri);
        break;
      // TODO: overlaps with document.onDidChangeContent but this is needed
      // because of file changes that we dont have open. we are super fast for
      // indexing files, so it should not be a huge issue
      case FileChangeType.Changed:
        await idl.updateDocumentSymbols(change.uri);
        break;
      default:
        // do nothing
        break;
    }
  }

  // detect and send problems
  idl.detectProblems(true);
});

connection.workspace.connection // This handler provides the initial list of the completion items.
  .onCompletion((position: TextDocumentPositionParams): CompletionItem[] =>
    idl.getCompletionItems(position)
  );

// when we auto complete, do any custom adjustments to the data before the auto-complete
// request gets back to the client
connection.onCompletionResolve((item: CompletionItem): CompletionItem => idl.postCompletion(item));

// handle when a user searches for a symbol
connection.onWorkspaceSymbol((params: WorkspaceSymbolParams): SymbolInformation[] =>
  idl.findSymbolsByName(params.query)
);

// handle when we want the definition of a symbol
connection.onDefinition(
  (params: TextDocumentPositionParams): Definition => idl.findSymbolDefinition(params, true)
);

connection.onHover((params: TextDocumentPositionParams): Hover => idl.getHoverHelp(params));

// handle when we request document symbols
connection.onDocumentSymbol(
  async (params: DocumentSymbolParams): Promise<SymbolInformation[] | DocumentSymbol[]> =>
    idl.getDocumentOutline(params)
);

// connection.onDidOpenTextDocument((params) => {
// 	// A text document got opened in VSCode.
// 	// params.uri uniquely identifies the document. For documents store on disk this is a file URI.
// 	// params.text the initial full content of the document.
// 	connection.console.log(`${params.textDocument.uri} opened.`);
// });
// connection.onDidChangeTextDocument((params) => {
// 	// The content of a text document did change in VSCode.
// 	// params.uri uniquely identifies the document.
// 	// params.contentChanges describe the content changes to the document.
// 	connection.console.log(`${params.textDocument.uri} changed: ${JSON.stringify(params.contentChanges)}`);
// });

// connection.onDidCloseTextDocument((params) => {
// 	// A text document got closed in VSCode.
// 	// params.uri uniquely identifies the document.
// 	connection.console.log(`${params.textDocument.uri} closed.`);
// });

// listen for changing documents
// Only keep settings for open documents
documents.onDidClose(e => {
  documentSettings.delete(e.document.uri);
});

// TODO: work with just the changed parts of a document
// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent(async change => {
  await idl.updateDocumentSymbolsForChange(change, true);
});

documents.onDidOpen(async opened => {
  await idl.getDocumentSymbolsForChange(opened, true);
});

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();
