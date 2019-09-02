import {
  Connection,
  TextDocuments,
  Definition,
  TextDocumentPositionParams,
  SymbolInformation,
  WorkspaceFolder,
  SymbolKind,
  DocumentSymbolParams,
  DocumentSymbol,
  TextDocumentChangeEvent,
  CompletionItem,
  Hover
} from "vscode-languageserver";
import { IDLSymbolExtractor } from "./idl-symbol-extractor";
import { IDLRoutineHelper } from "./idl-routine-helper";
import { IDLProblemDetector } from "./idl-problem-detector";
import { IDLSymbolManager } from "./idl-symbol-manager";
import { IDLFileHelper } from "./idl-file-helper";

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
    const query = this.manager.getSelectedSymbol(position).name;
    // this.consoleLog(query);
    const res = this.helper.completion(query, true);
    // this.consoleLog(res);
    if (res.length > 0) {
      if (res[0].label === query) {
        return { contents: res[0].documentation };
      } else {
        return { contents: "" };
      }
    } else {
      return { contents: "" };
    }
  }

  // get our completion items when typing
  getCompletionItems(position: TextDocumentPositionParams): CompletionItem[] {
    // get the word that we are trying to complete
    // do this here just so we dont have to split larger files more than once
    // because we need the strings, split, and regex to find our work
    const query = this.manager.getSelectedSymbol(position).name;

    // get docs matches
    let docsMatches = this.helper.completion(query);

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
      .filter(symbol => {
        return symbol.kind !== SymbolKind.Variable;
      })
      .map(symbol => {
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

  async getDocumentSymbols(
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

  async updateDocumentSymbols(
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
  async indexWorkspace(folders: WorkspaceFolder[], sendProblems = false) {
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
