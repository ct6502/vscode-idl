import { IRoutines } from "../core/routines.interface";
import {
  CompletionItemKind,
  TextDocumentPositionParams,
  CompletionItem,
  Connection,
  TextDocuments
} from "vscode-languageserver";

// class definition
export class IDLRoutineHelper {
  connection: Connection;
  documents: TextDocuments;
  routines: IRoutines;
  functions: { [key: string]: boolean } = {};
  procedures: { [key: string]: boolean } = {};

  constructor(connection: Connection, documents: TextDocuments) {
    this.connection = connection;
    this.documents = documents;
    this.routines = this._parseRoutines();
  }

  // The pass parameter contains the position of the text document in
  // which code complete got requested. For the example we ignore this
  // info and always provide the same completion items.
  completion(
    _textDocumentPosition: TextDocumentPositionParams
  ): CompletionItem[] {
    return this.routines.docs;
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
