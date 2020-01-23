import { DocumentSelector } from 'vscode';

export const IDL_MODE: DocumentSelector = { language: 'idl', scheme: 'file' };

// extension settings - ONLY READONLY
export interface IDLConfiguration {
  readonly idlDir: string;
  readonly dontAskForIdlDir: boolean;
  readonly idlPath: string[];
  readonly addWorkspaceFoldersToPath: boolean;
  readonly appendOrPrependWorkspaceFolders: 'append' | 'prepend';
  readonly verboseExtensionClient: boolean;
  readonly verboseServerClient: boolean;
  readonly debugMode: boolean;
}

// default extension settings, should match package.json
export const DEFAULT_IDL_CONFIGURATION: IDLConfiguration = {
  idlDir: '',
  dontAskForIdlDir: false,
  idlPath: [],
  addWorkspaceFoldersToPath: true,
  appendOrPrependWorkspaceFolders: 'prepend',
  verboseExtensionClient: true,
  verboseServerClient: false,
  debugMode: false
};
