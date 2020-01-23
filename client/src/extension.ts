import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { ExtensionContext, workspace } from 'vscode';
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind
} from 'vscode-languageclient';
import { cleanPath } from './utils/clean-path';

// load our translations
// MUST BE FIRST BEFORE ALL OTHER CODE IN LOADED
// BECAUSE WE IMPORT THIS CONSTANT INTO THEM, THUS IT NEEDS TO BE FIRST
export const idlTranslation = getLanguageLookup();

// idl imports, some of which rely on our constant  above
import { IDLTerminal } from './core/idl-terminal.class';
import { Log } from './core/logger.class';
import { IDLConfiguration } from './extension.interface';
import { IDLCommandProvider } from './providers/idl-commands';
import { validateConfig } from './providers/idl-config';
import { IDLTreeClickHandler } from './providers/idl-tree-click-handler';
import { IDLTreeViewProvider } from './providers/idl-tree-view';
import { ITranslation } from './translation.interface';

// save a reference to our language server client
let client: LanguageClient;

// global variables that we need to access from anywhere
export let idlWorkspaceConfiguration: vscode.WorkspaceConfiguration;
export let idlConfiguration: IDLConfiguration;
// export const idlConfigurationEmitter = new EventEmitter();
export let idlLogger: Log;
export let idlTerminal: IDLTerminal;
export let idlTreeClickHandler: IDLTreeClickHandler;
export let idlTreeViewProvider: IDLTreeViewProvider;
export let idlCommands: IDLCommandProvider;

// function to activate our extension
export function activate(ctx: ExtensionContext) {
  // The server is implemented in node
  const serverModule = ctx.asAbsolutePath(path.join('server', 'dist', 'server.js'));

  // The debug options for the server
  // --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging
  const debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] };

  // If the extension is launched in debug mode then the debug server options are used
  // Otherwise the run options are used
  const serverOptions: ServerOptions = {
    run: { module: serverModule, transport: TransportKind.ipc },
    debug: {
      module: serverModule,
      transport: TransportKind.ipc,
      options: debugOptions
    }
  };

  // Options to control the language client
  const clientOptions: LanguageClientOptions = {
    // Register the server for plain text documents
    documentSelector: [{ language: 'idl', scheme: 'file' }],
    synchronize: {
      // Notify the server about file changes to '.clientrc files contained in the workspace
      fileEvents: workspace.createFileSystemWatcher('**/*.pro')
    }
  };

  // create our logger
  idlLogger = new Log();

  // Create the language client and start the client.
  client = new LanguageClient(
    'IDLLanguageServer',
    idlTranslation.debugger.logs.server,
    serverOptions,
    clientOptions
  );

  // get configuration as object and as interface for simple access
  idlWorkspaceConfiguration = vscode.workspace.getConfiguration('idl');
  idlConfiguration = (idlWorkspaceConfiguration as any) as IDLConfiguration;
  idlLogger.updateConfiguration();
  idlLogger.log({ content: ['Initial IDL configuration', idlConfiguration], verbose: false });

  // validate the config
  validateConfig(idlConfiguration);

  // listen for configuration (preference) changes
  vscode.workspace.onDidChangeConfiguration(ev => {
    // filter if we arent changing IDL configurations
    if (ev.affectsConfiguration('idl')) {
      idlWorkspaceConfiguration = vscode.workspace.getConfiguration('idl');
      idlConfiguration = (idlWorkspaceConfiguration as any) as IDLConfiguration;

      // validate the config
      // validateConfig(idlConfiguration);

      // emit for our listeners
      // idlConfigurationEmitter.emit('config', idlConfiguration);

      // propogate changes
      handleConfigurationUpdate();

      // print only hafter we update
      idlLogger.log({ content: 'IDL configuration updated' });
      idlLogger.log({ content: idlConfiguration, verbose: true });
    }
  });

  idlLogger.log({ content: 'Starting IDL debug server (not IDL)', verbose: true });

  // create IDl terminal object - interacts only with terminals
  idlTerminal = new IDLTerminal();

  // create our click handler - which is also our command sender to IDL
  idlTreeClickHandler = new IDLTreeClickHandler();

  // create our object that registers commands
  idlLogger.log({ content: 'Registering IDL commands', verbose: true });
  idlCommands = new IDLCommandProvider();
  idlCommands.registerCommands(ctx);

  // generate our tree provider and get the view for listening to events
  idlLogger.log({ content: 'Creating IDL tree view', verbose: true });
  idlTreeViewProvider = new IDLTreeViewProvider();
  idlTreeViewProvider.createView();

  // Start the client. This will also launch the server
  idlLogger.log({ content: 'Starting language server' });
  client.start();
}

export function deactivate(): Thenable<void> | undefined {
  if (!client) {
    return undefined;
  }
  return client.stop();
}

function handleConfigurationUpdate() {
  idlLogger.updateConfiguration();
}

export function getExtensionDir() {
  return path.dirname(path.dirname(__dirname));
}

export function getI18nDir() {
  return path.join(getExtensionDir(), 'i18n');
}

export function getLanguageLookup(): ITranslation {
  // get the language
  const language = JSON.parse(process.env.VSCODE_NLS_CONFIG);

  // get the directory we are reading from
  const dir = cleanPath(getI18nDir());

  // get the files for our language
  const defaultLanguageFile = `${dir}${path.sep}en.json`;
  const languageFile = `${dir}${path.sep}${language.locale}.json`;

  return JSON.parse(
    fs.readFileSync(fs.existsSync(languageFile) ? languageFile : defaultLanguageFile, {
      encoding: 'utf8'
    })
  );
}
