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
  allowTypo: false, // if you don't care about allowing typos
  threshold: -10000 // don't return bad results
};

// class definition for object that extracts routines from the help content
// and eventually will get docs from things like comments
export class IDLRoutineHelper {
  connection: Connection;
  documents: TextDocuments;
  manager: IDLDocumentSymbolManager;
  routines: IRoutines;
  functions: { [key: string]: number } = {};
  procedures: { [key: string]: number } = {};
  constants: { [key: string]: number } = {};
  other: { [key: string]: number } = {};
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
    query: string
  ): CompletionItem[] {
    // search, map to indices, filter by matches in our array, map to the completion items
    return this.routines.docs

    // // search for our matches
    // const matches = fuzzysort.go(query, this.routineKeysSearch, searchOptions);

    // // potentially can be 30% faster method for searching with manual loops
    // // old code is below
    // const items: CompletionItem[] = []
    // for (let idx = 0; idx < matches.length; idx++) {
    //   const lc = matches[idx].target.toLowerCase();
    //   // handle setting proper information for our data things and such
    //   switch (true) {
    //     case (lc in this.functions):
    //       items.push(this.routines.docs[this.functions[lc]])
    //       break;
    //     case (lc in this.procedures):
    //       items.push(this.routines.docs[this.procedures[lc]])
    //       break;
    //     case (lc in this.constants):
    //       items.push(this.routines.docs[this.constants[lc]])
    //       break;
    //     case (lc in this.other):
    //       items.push(this.routines.docs[this.other[lc]])
    //       break;
    //     default:
    //       return // DO NBOTHING
    //   }
    // }

    // method to get our items with maps and filters, can be 8 ms (42 vs 16) slower than below
    // const items =
    //   matches.map(match => {
    //     const lc = match.target.toLowerCase();
    //     // handle setting proper information for our data things and such
    //     switch (true) {
    //       case (lc in this.functions):
    //         return this.functions[lc]
    //         break;
    //       case (lc in this.procedures):
    //         return this.procedures[lc]
    //         break;
    //       case (lc in this.constants):
    //         return this.constants[lc]
    //         break;
    //       case (lc in this.other):
    //         return this.other[lc]
    //         break;
    //       default:
    //         return -1
    //     }
    //   })
    //     .filter(idx => idx !== -1)
    //     .map(idx => this.routines.docs[idx]);

    // return items
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
          this.functions[item.label.toLowerCase()] = idx;
          break;
        case idlRoutines.procedures[str]:
          item.insertText = item.label + ",";
          item.kind = CompletionItemKind.Function;
          this.procedures[item.label.toLowerCase()] = idx;
          break;
        case item.label.startsWith("!"):
          item.kind = CompletionItemKind.Constant;
          this.constants[item.label.toLowerCase()] = idx;
          break;
        default:
          this.other[item.label.toLowerCase()] = idx;
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
