import {
  CompletionItem,
  Connection,
  Definition,
  DocumentSymbol,
  DocumentSymbolParams,
  Hover,
  SymbolInformation,
  SymbolKind,
  TextDocumentChangeEvent,
  TextDocumentPositionParams,
  TextDocuments,
  WorkspaceFolder
} from 'vscode-languageserver';
import { IDLFileHelper } from './idl-file-helper';
import { IDLProblemDetector } from './idl-problem-detector';
import { IDLRoutineHelper } from './idl-routine-helper';
import { IDLSymbolExtractor } from './idl-symbol-extractor';
import { IDLSymbolManager } from './idl-symbol-manager';

export class IDL {
  // connection specific properties for vscode lang server
  documents: TextDocuments;
  connection: Connection;

  // all of our IDL helper objects
  helper: IDLRoutineHelper; // internal routine helper
  problems: IDLProblemDetector; // problems
  manager: IDLSymbolManager; // manage all symbols from all docs and workspaces
  extractor: IDLSymbolExtractor; // load symbols from a file
  files: IDLFileHelper; // clean strings for analysis

  constructor(documents: TextDocuments, connection?: Connection) {
    this.documents = documents;
    if (connection) {
      this.connection = connection;
    }

    // create all of our child objects
    this.helper = new IDLRoutineHelper(this);
    this.problems = new IDLProblemDetector(this);
    this.manager = new IDLSymbolManager(this);
    this.extractor = new IDLSymbolExtractor(this);
    this.files = new IDLFileHelper(this);
  }

  consoleLog(thing: any) {
    this.connection.console.log(JSON.stringify(thing));
  }

  // find the definition of a selected symbol
  findSymbolDefinition(params: TextDocumentPositionParams, limit: boolean): Definition {
    return this.manager.findSymbolDefinition(params, limit);
  }

  // search for symbol definitions based on name
  findSymbolsByName(query: string): SymbolInformation[] {
    return this.manager.findSymbolsByName(query);
  }

  getHoverHelp(position: TextDocumentPositionParams): Hover {
    // get the word that we are trying to complete
    // do this here just so we dont have to split larger files more than once
    // because we need the strings, split, and regex to find our work
    const query = this.manager.getSelectedSymbol(position);

    // dont search if empty string
    if (query.name === '') {
      return { contents: '' };
    }

    // search for results
    const res = this.helper.completion(query, true);

    // determine how to proceed
    switch (true) {
      // no matches no dice
      case res.length === 0:
        return { contents: '' };
      // if the first item matches, then send
      case res[0].label.toLowerCase() === query.searchName.toLowerCase():
        return { contents: res[0].documentation };
      // default, don't send anything
      default:
        return { contents: '' };
    }
  }

  // get our completion items when typing
  getCompletionItems(position: TextDocumentPositionParams): CompletionItem[] {
    // get the word that we are trying to complete
    // do this here just so we dont have to split larger files more than once
    // because we need the strings, split, and regex to find our work
    const query = this.manager.getSelectedSymbol(position);

    // check if we are a method
    let docsMatches: CompletionItem[];
    if (query.isMethod) {
      docsMatches = this.helper.completion(query, true);
      if (docsMatches.length === 0) {
        docsMatches = this.helper.completion(query, false);
      }
    } else {
      docsMatches = this.helper.completion(query, false);
    }

    // get symbol matches
    const symMatches = this.manager.completion(query, position);
    if (symMatches.length > 0) {
      docsMatches = docsMatches.concat(symMatches);
    }

    return docsMatches;
  }

  // after we use auto-complete on an item, do anything afterwards to clean it up?
  postCompletion(item: CompletionItem): CompletionItem {
    // // get the id
    // const key = item.data.toString();

    // // check if function or procedure
    // switch (true) {
    // 	default:
    // 		// do nothing
    // }
    return item;
  }

  // detect problems and, optionally, send them
  detectProblems(sendProblems = false) {
    // detect problems because we had change
    if (sendProblems) {
      this.problems.detectAndSendProblems();
    } else {
      this.problems.detectProblems();
    }
  }

  // get document outline which filters out variables
  async getDocumentOutline(params: DocumentSymbolParams): Promise<DocumentSymbol[]> {
    return (await this.manager.get.documentSymbols(params.textDocument.uri))
      .filter(symbol => symbol.kind !== SymbolKind.Variable)
      .map(symbol => ({
        name: symbol.displayName,
        detail: symbol.detail,
        kind: symbol.kind,
        range: symbol.range,
        selectionRange: symbol.selectionRange,
        children: symbol.children
      }));
  }

  async getDocumentSymbolsForChange(
    opened: TextDocumentChangeEvent,
    sendProblems = false
  ): Promise<DocumentSymbol[]> {
    // generate new symbols with the update, seems to magically sync when there are changes?
    const syms = await this.manager.get.documentSymbols(opened.document.uri);

    // detect problems because we had change
    if (sendProblems) {
      this.problems.detectAndSendProblems();
    } else {
      this.problems.detectProblems();
    }

    // return our symbols
    return syms;
  }

  async addDocumentSymbols(uri: string): Promise<void> {
    // check if we need to add our file to an open workspace - not sure why this might happen
    // unless we have changes that arent detected
    // scenario could be files are added to a workspace after we search it, this will save where the
    // file is so that, when we close the workspace, we properly clean up
    const folders = Object.keys(this.manager.workspaceFiles);
    for (let i = 0; i < folders.length; i++) {
      const folder = folders[i];
      if (uri.includes(folder)) {
        // verify that we dont already have it
        if (!this.manager.workspaceFiles[folder][uri]) {
          this.manager.workspaceFiles[folder][uri] = true;
        }
        break;
      }
    }

    // generate new symbols with the update, seems to magically sync when there are changes?
    await this.manager.get.documentSymbols(uri);
  }

  async updateDocumentSymbols(uri: string): Promise<void> {
    // generate new symbols with the update, seems to magically sync when there are changes?
    await this.manager.update(uri);
  }

  async removeDocumentSymbols(uri: string) {
    // remove the old symbols
    await this.manager.remove(uri);
  }

  async updateDocumentSymbolsForChange(
    changed: TextDocumentChangeEvent,
    sendProblems = false
  ): Promise<DocumentSymbol[]> {
    // generate new symbols with the update, seems to magically sync when there are changes?
    const syms = await this.manager.update(changed.document.uri);

    // detect problems because we had change
    if (sendProblems) {
      this.problems.detectAndSendProblems();
    } else {
      this.problems.detectProblems();
    }

    // return our symbols
    return syms;
  }

  // get everything for our workspace
  async removeWorkspaces(folders: WorkspaceFolder[]) {
    await this.manager.removeWorkspaces(folders);
  }

  // get everything for our workspace
  async indexWorkspaces(folders: WorkspaceFolder[], sendProblems = false) {
    // index!
    await this.manager.indexWorkspaces(folders);

    // check if we need to send problems
    if (sendProblems) {
      this.problems.detectAndSendProblems();
    } else {
      this.problems.detectProblems();
    }
  }
}
