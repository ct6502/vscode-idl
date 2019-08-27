import { IRoutines } from "../core/routines.interface";
import {
  CompletionItemKind,
  TextDocumentPositionParams,
  CompletionItem,
  Connection,
  TextDocuments
} from "vscode-languageserver";
import fuzzysort = require("fuzzysort"); // search through the symbols
import { IDLDocumentSymbolManager } from "./idl-document-symbol-manager";

// options for controlling search performance
const searchOptions = {
  limit: 50, // don't return more results than you need!
  allowTypo: true // if you don't care about allowing typos
  // threshold: -10000 // don't return bad results
};

// class definition for object that extracts routines from the help content
// and eventually will get docs from things like comments
export class IDLRoutineHelper {
  connection: Connection;
  documents: TextDocuments;
  manager: IDLDocumentSymbolManager;
  routines: IRoutines;
  functions: { [key: string]: boolean } = {};
  procedures: { [key: string]: boolean } = {};
  routineKeys = [];
  routineKeysSearch: any[] = [];

  constructor(connection: Connection, documents: TextDocuments, manager: IDLDocumentSymbolManager) {
    this.connection = connection;
    this.documents = documents;
    this.manager = manager;
    this.routineKeys = [];
    this.routineKeysSearch = [];
    this.routines = this._parseRoutines();
  }

  // return items from the docs for completion
  completion(
    _textDocumentPosition: TextDocumentPositionParams
  ): CompletionItem[] {
    // get the symbol that we are auto-completing
    const query = this.manager.getSelectedSymbolName(_textDocumentPosition)

    // search, map to indices, filter by matches in our array, map to the completion items
    return fuzzysort
      .go(query, this.routineKeysSearch, searchOptions)
      .map(match => this.routineKeys.indexOf(match.target))
      .filter(idx => idx !== -1)
      .map(idx => this.routines.docs[idx]);
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

  private _parseRoutines(): IRoutines {
    // load our different routines
    const idlRoutines: IRoutines = require("../../routines/idl.json");

    // give proper symbol
    idlRoutines.docs.forEach((item, idx) => {
      // get key as string
      const str = idx.toString();

      // check for our system variable !null
      if (item.label === null) {
        item.label = "!null";
      }

      // save our label information
      this.routineKeys.push(item.label);
      this.routineKeysSearch.push(fuzzysort.prepare(item.label));

      // handle setting proper information for our data things and such
      switch (true) {
        case idlRoutines.functions[str]:
          item.insertText = item.label + "(";
          item.kind = CompletionItemKind.Function;
          this.functions[item.label.toLowerCase()] = true;
          break;
        case idlRoutines.procedures[str]:
          item.insertText = item.label + ",";
          item.kind = CompletionItemKind.Function;
          this.procedures[item.label.toLowerCase()] = true;
          break;
        case item.label.startsWith("!"):
          item.kind = CompletionItemKind.Constant;
          break;
        default:
          item.kind = CompletionItemKind.Text;
      }

      // check if we are an ENVI task, replace with ENVITask('TaskName')
      if (item.label.startsWith("ENVI") && item.label.endsWith("Task")) {
        item.insertText =
          "ENVITask('" +
          item.label.substr(0, item.label.length - 4).substr(4) +
          "')";
      }

      // check if we are an IDL task, replace with ENVITask('TaskName')
      if (item.label.startsWith("IDL") && item.label.endsWith("Task")) {
        item.insertText =
          "IDLTask('" +
          item.label.substr(0, item.label.length - 4).substr(3) +
          "')";
      }

      // save change
      idlRoutines.docs[idx] = item;
    });

    return idlRoutines;
  }
}
