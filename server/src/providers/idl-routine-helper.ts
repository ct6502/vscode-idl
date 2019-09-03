import { IRoutines } from "../core/routines.interface";
import { CompletionItemKind, CompletionItem, MarkupKind } from "vscode-languageserver";
import fuzzysort = require("fuzzysort"); // search through the symbols
import { IDL } from "./idl";
import { ISelectedWord } from "./idl-symbol-extractor";
import { IQuickLookup, IQuickSearchLookup } from "../core/search.interface";

// options for controlling search performance
const searchOptions = {
  limit: 50, // don't return more results than you need!
  allowTypo: false, // if you don't care about allowing typos
  threshold: -10000 // don't return bad results
};

// class definition for object that extracts routines from the help content
// and eventually will get docs from things like comments
export class IDLRoutineHelper {
  idl: IDL;
  routines: IRoutines;
  functions: { [key: string]: number } = {};
  procedures: { [key: string]: number } = {};
  constants: { [key: string]: number } = {};
  other: { [key: string]: number } = {};
  routineKeys = [];
  routineKeysSearch: Fuzzysort.Prepared[] = [];

  // qtore a quick lookup object with just arrays of routines and methods
  quickLookup: IQuickLookup = {
    functions: [],
    procedures: [],
    functionMethods: [],
    procedureMethods: []
  };

  // qtore a quick lookup object with just arrays of routines and methods
  quickSearchLookup: IQuickSearchLookup = {
    functions: [],
    procedures: [],
    functionMethods: [],
    procedureMethods: []
  };

  constructor(idl: IDL) {
    this.idl = idl;

    // init properties
    this.routines = this._parseRoutines();
  }

  // return items from the docs for completion
  completion(query: ISelectedWord, optimized = false): CompletionItem[] {
    // search, map to indices, filter by matches in our array, map to the completion items
    // check how we return our results
    if (!optimized) {
      switch (true) {
        case (query.isMethod && query.equalBefore) || (query.isMethod && query.isFunction):
          this.idl.consoleLog("Function method results");
          return this.quickLookup.functionMethods;
        // function or potential function (equal sign on the left)
        case query.equalBefore || query.isFunction:
          this.idl.consoleLog("Function results");
          return this.quickLookup.functions;
        // nothing typed, so just return everything
        case query.name === "":
          this.idl.consoleLog("all docs");
          return this.routines.docs;
        case query.isMethod && !query.equalBefore:
          this.idl.consoleLog("Procedure method results");
          return this.quickLookup.procedureMethods;
        default:
          this.idl.consoleLog("procedure results");
          return this.quickLookup.procedures;
      }
    } else {
      // check how we should search
      let matches: any;
      switch (true) {
        // function method
        case (query.isMethod && query.equalBefore) || (query.isMethod && query.isFunction):
          this.idl.consoleLog("Function method results");
          matches = fuzzysort.go(
            query.searchName,
            this.quickSearchLookup.functionMethods,
            searchOptions
          );
          break;
        // procedure method
        case query.isMethod && !query.equalBefore:
          this.idl.consoleLog("Procedure method results");
          matches = fuzzysort.go(
            query.searchName,
            this.quickSearchLookup.procedureMethods,
            searchOptions
          );
          break;
        // functions
        case query.equalBefore || query.isFunction:
          this.idl.consoleLog("Function results");
          matches = fuzzysort.go(query.searchName, this.quickSearchLookup.functions, searchOptions);
          break;
        // default to procedures
        default:
          this.idl.consoleLog("Procedure results");
          matches = fuzzysort.go(
            query.searchName,
            this.quickSearchLookup.procedures,
            searchOptions
          );
      }

      // potentially can be 30% faster method for searching with manual loops
      // old code is below
      const items: CompletionItem[] = [];
      for (let idx = 0; idx < matches.length; idx++) {
        const lc = matches[idx].target.toLowerCase();
        // handle what lookup our item comes from, based on how parsed when laoded
        switch (true) {
          case lc in this.functions:
            items.push(this.routines.docs[this.functions[lc]]);
            break;
          case lc in this.procedures:
            items.push(this.routines.docs[this.procedures[lc]]);
            break;
          case lc in this.constants:
            items.push(this.routines.docs[this.constants[lc]]);
            break;
          case lc in this.other:
            items.push(this.routines.docs[this.other[lc]]);
            break;
          default: // DO NBOTHING
        }
      }

      return items;
    }
  }

  // method for loading all of our routines into memory from the JSON file on disk
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
      const prepped = fuzzysort.prepare(item.label);
      this.routineKeysSearch.push(prepped);

      // handle setting proper information for our data things and such
      let split: string[];
      switch (true) {
        case idlRoutines.functions[str] && idlRoutines.methods[str]:
          split = item.label.split("::");
          item.insertText = split[1] + "(";
          item.filterText = split[1];
          item.kind = CompletionItemKind.Method;
          this.functions[item.label.toLowerCase()] = idx;
          this.quickLookup.functionMethods.push(item);
          this.quickSearchLookup.functionMethods.push(prepped);
          break;
        case idlRoutines.procedures[str] && idlRoutines.methods[str]:
          split = item.label.split("::");
          item.insertText = split[1] + ",";
          item.label = split[1]; //+ " (" + split[0] + " method)";
          item.kind = CompletionItemKind.Function;
          this.procedures[item.label.toLowerCase()] = idx;
          this.quickLookup.procedureMethods.push(item);
          this.quickSearchLookup.procedureMethods.push(prepped);
          break;
        case idlRoutines.functions[str]:
          item.insertText = item.label + "(";
          item.kind = CompletionItemKind.Function;
          this.functions[item.label.toLowerCase()] = idx;
          this.quickLookup.functions.push(item);
          this.quickSearchLookup.functions.push(prepped);
          break;
        case idlRoutines.procedures[str]:
          item.insertText = item.label + ",";
          item.kind = CompletionItemKind.Function;
          this.procedures[item.label.toLowerCase()] = idx;
          this.quickLookup.procedures.push(item);
          this.quickSearchLookup.procedures.push(prepped);
          break;
        case item.label.startsWith("!"):
          item.kind = CompletionItemKind.Constant;
          this.constants[item.label.toLowerCase()] = idx;
          break;
        default:
          this.other[item.label.toLowerCase()] = idx;
          item.kind = CompletionItemKind.Text;
      }

      // // clean up/build documentation information
      const docs: any = item.documentation;
      if (docs.length > 0) {
        const docsLink =
          "https://www.harrisgeospatial.com/docs/" + idlRoutines.links[idx.toString()];
        let docsStart: string;
        docsStart =
          [
            "#### " + item.label + " - [Documentation Link](" + docsLink + ")",
            item.detail,
            "",
            "#### Syntax",
            "```idl"
          ].join("\n") + "\n";

        item.documentation = {
          kind: MarkupKind.Markdown,
          value: docsStart + docs.join("\n") + "\n```\n \n \n"
        };
      } else {
        item.documentation = "No documentation";
      }

      // check if we are an ENVI task, replace with ENVITask('TaskName')
      if (item.label.startsWith("ENVI") && item.label.endsWith("Task")) {
        item.insertText =
          "ENVITask('" + item.label.substr(0, item.label.length - 4).substr(4) + "')";
      }

      // check if we are an IDL task, replace with ENVITask('TaskName')
      if (item.label.startsWith("IDL") && item.label.endsWith("Task")) {
        item.insertText =
          "IDLTask('" + item.label.substr(0, item.label.length - 4).substr(3) + "')";
      }

      // save change
      idlRoutines.docs[idx] = item;
    });

    return idlRoutines;
  }
}
