import {
  SymbolInformation,
  DocumentSymbol,
  SymbolKind,
  Location,
  Range,
  Position,
  CompletionItemKind
} from "vscode-languageserver";
import { IDL } from "./idl";

export interface IDLDocumentSymbol extends DocumentSymbol {
  displayName?: string;
}

export interface ISelectedWord {
  name: string; // full word (including method accessors) that we have selected
  searchName: string; // if method, includes '::' and the method name for searching
  objName: string; // if method, the variable name we came from
  methodName: string; // if method, the method that we are calling
  isFunction: boolean; // indicates if we are a function or not
  isMethod: boolean; // indicates  if we are a method or not
  equalBefore: boolean; // if there is an equal sign on the line before our symbol that we found
}

// if we have a method, make it clear we have that in the document description string
function resolveRoutineNameAdd(match: string): string {
  switch (true) {
    case match.includes("::"):
      return " method";
      break;
    case match.toLowerCase().endsWith("__define"):
      return " (class definition)";
      break;
    default:
      return "";
  }
}

// get the proper symbol type for what we found, just for routines now
function resolveRoutineType(match: string): SymbolKind {
  switch (true) {
    case match.includes("::"):
      return SymbolKind.Method;
      break;
    case match.toLowerCase().endsWith("__define"):
      return SymbolKind.Class;
      break;
    default:
      return SymbolKind.Function;
  }
}

// get the proper symbol type for what we found, just for routines now
export function resolveCompletionItemKind(symbol: SymbolKind): CompletionItemKind {
  switch (symbol) {
    case SymbolKind.Method:
      return CompletionItemKind.Method;
      break;
    case SymbolKind.Class:
      return CompletionItemKind.Class;
      break;
    case SymbolKind.Function:
      return CompletionItemKind.Function;
      break;
    case SymbolKind.Variable:
      return CompletionItemKind.Variable;
      break;
    default:
      return CompletionItemKind.Text;
  }
}

export class IDLSymbolExtractor {
  idl: IDL;
  constructor(idl: IDL) {
    this.idl = idl;
  }

  private _extractFunctions(text: string, objects: string[]): IDLDocumentSymbol[] {
    // init symbols
    const symbols: IDLDocumentSymbol[] = [];

    // find all function definitions
    const funcRegex = /(?<=^\s*function[\s]+)[a-z_][a-z_$0-9:]*/gim;
    let m: RegExpExecArray;
    while ((m = funcRegex.exec(text)) !== null) {
      // This is necessary to avoid infinite loops with zero-width matches
      if (m.index === funcRegex.lastIndex) {
        funcRegex.lastIndex++;
      }

      // get the line of this character
      const split = text.substr(0, m.index).split("\n");
      const lineNumber = split.length - 1;
      const start = split[split.length - 1].length; // length of string start

      // The result can be accessed through the `m`-variable.
      m.forEach((match, groupIndex) => {
        // check for object
        const lowMatch = match.toLowerCase();
        if (lowMatch.includes("__define")) {
          const objName = lowMatch.replace("__define", "");
          if (objects.indexOf(objName) == -1) {
            objects.push(objName);
          }
        }

        // build the location of the match
        const range = Range.create(
          Position.create(lineNumber, start),
          Position.create(lineNumber, start + match.length)
        );

        const symbol: IDLDocumentSymbol = DocumentSymbol.create(
          match + "()",
          "Function" + resolveRoutineNameAdd(match),
          resolveRoutineType(match),
          range,
          range
        );

        // save the display name of our symbol, hack to get around custom IDL symbol here
        symbol.displayName = match + "()";

        // save
        symbols.push(symbol);
      });
    }

    // clean up symbol names for object definitions
    if (objects.length == 1) {
      symbols.forEach((symbol, idx) => {
        const lowName = symbol.displayName.toLowerCase();
        if (lowName.includes(objects[0]) && lowName.includes(":")) {
          // update name
          symbol.displayName = symbol.displayName.substr(symbol.displayName.indexOf(":"));
        }
      });
    }

    // return our symbols
    return symbols;
  }

  private _extractProcedures(text: string, objects: string[]): IDLDocumentSymbol[] {
    // init symbols
    const symbols: IDLDocumentSymbol[] = [];

    // find all procedure definitions
    const proRegex = /(?<=^\s*pro[\s]+)[a-z_][a-z_$0-9:]*/gim;
    let m: RegExpExecArray;
    while ((m = proRegex.exec(text)) !== null) {
      // This is necessary to avoid infinite loops with zero-width matches
      if (m.index === proRegex.lastIndex) {
        proRegex.lastIndex++;
      }

      // get the line of this character
      const split = text.substr(0, m.index).split("\n");
      const lineNumber = split.length - 1;
      const start = split[split.length - 1].length; // length of string start

      // The result can be accessed through the `m`-variable.
      m.forEach((match, groupIndex) => {
        // check for object
        const lowMatch = match.toLowerCase();
        if (lowMatch.includes("__define")) {
          const objName = lowMatch.replace("__define", "");
          if (objects.indexOf(objName) == -1) {
            objects.push(objName);
          }
        }

        // get range
        const range = Range.create(
          Position.create(lineNumber, start),
          Position.create(lineNumber, start + match.length)
        );

        // make our symbol
        const symbol: IDLDocumentSymbol = DocumentSymbol.create(
          match,
          "Procedure" + resolveRoutineNameAdd(match),
          resolveRoutineType(match),
          range,
          range
        );

        // save the display name of our symbol, hack to get around custom IDL symbol here
        symbol.displayName = match;

        // save
        symbols.push(symbol);
      });
    }

    // clean up symbol names for object definitions
    if (objects.length == 1) {
      symbols.forEach((symbol, idx) => {
        const lowName = symbol.displayName.toLowerCase();
        if (lowName.includes(objects[0]) && lowName.includes(":")) {
          // update name
          symbol.displayName = symbol.displayName.substr(symbol.displayName.indexOf(":"));
        }
      });
    }

    // return our symbols
    return symbols;
  }

  // grab variables, not perfect but a happy fix for losing this functionality
  private _extractVariables(text: string): IDLDocumentSymbol[] {
    // init symbols
    const symbols: IDLDocumentSymbol[] = [];

    // find all procedure definitions
    // (skip if line continuation)(dont use if continue, begin, or endif is ahead)(ok for start or in if statements)
    const proRegex = /(?<!,\s*\$.*\n^\s*)(?<=^\s*|then |else | else\s*:|:\s*)([a-z_][a-z_$0-9]*)(?=\s*=)/gim;
    let m: RegExpExecArray;
    while ((m = proRegex.exec(text)) !== null) {
      // This is necessary to avoid infinite loops with zero-width matches
      if (m.index === proRegex.lastIndex) {
        proRegex.lastIndex++;
      }

      // get the line of this character
      const split = text.substr(0, m.index).split("\n");
      const lineNumber = split.length - 1;
      const start = split[split.length - 1].length; // length of string start

      // The result can be accessed through the `m`-variable.
      m.forEach((match, groupIndex) => {
        // get range
        const range = Range.create(
          Position.create(lineNumber, start),
          Position.create(lineNumber, start + match.length)
        );

        // make our symbol
        // TODO: figure out how to associate these with a routine so that
        // we could "catch" errors with redifining variable. but do we need this?
        // we dont have this in TS so maybe not
        const symbol: IDLDocumentSymbol = DocumentSymbol.create(
          match,
          "Variable",
          SymbolKind.Variable,
          range,
          range
        );

        // save the display name of our symbol, hack to get around custom IDL symbol here
        symbol.displayName = match;

        // save
        symbols.push(symbol);
      });
    }

    // return our symbols
    return symbols;
  }

  getSelectedWord(line: string, position: Position): ISelectedWord {
    // placeholder for the name
    let symbolName = "";
    let functionFlag = false;

    // check for an qual sign
    let equalBefore = false;
    let equalPos = line.indexOf("=");
    if (equalPos !== -1) {
      equalBefore = equalPos < position.character;
    }

    // regex for valid character to be before
    // const wordRegEx = /[a-z_][\.a-z0-9:_$\-\>]*/gim;
    const wordRegEx = /[\.a-z0-9:_$\-\>][\.a-z0-9:_$\-\>]*/gim;

    // get the character position - move to the left so that we are in a word
    // otherwise we are outside a word as we are on the next character
    // which is usuallya  space
    let useChar = position.character;
    if (position.character > 0) {
      // check if we can get a character before our cursor or not
      useChar = useChar - 1;
      switch (true) {
        case useChar === 0:
          const name = line.substr(0, 1).trim();
          return {
            name: name,
            searchName: name,
            objName: "",
            methodName: "",
            isMethod: false,
            isFunction: false,
            equalBefore: equalBefore
          };
        // character before is not a word, space or something we cant split up
        // so move back to where our cursor is
        case !wordRegEx.test(line.substr(useChar, 1)):
          useChar += 1;
          break;
        default: // do nothing
      }
    }

    // split by words to extract our symbol that we may have clicked on
    // TODO: add logic for objects and methods here, func/pro are good for now
    let m: RegExpExecArray;
    while ((m = wordRegEx.exec(line)) !== null) {
      // This is necessary to avoid infinite loops with zero-width matches
      if (m.index === wordRegEx.lastIndex) {
        wordRegEx.lastIndex++;
      }

      for (let i = 0; i < m.length; i++) {
        const idx = line.indexOf(m[i]);
        if (idx !== -1) {
          // check if we have a match
          if (idx <= useChar && idx + m[i].length >= useChar) {
            symbolName = m[i];
            functionFlag = line.substr(idx + m[i].length, 1) === "(";
            break;
          }
        }
      }
      if (symbolName !== "") {
        break;
      }
    }

    // check if we need to clean up the name
    let split: string[];
    let isMethod = false;
    let searchName: string, objName: string, methodName: string;
    switch (true) {
      case symbolName.includes("."):
        split = symbolName.split(".");
        searchName = "::" + split[1];
        objName = split[0];
        methodName = split[1];
        isMethod = true;
        break;
      case symbolName.includes("->"):
        split = symbolName.split("->");
        searchName = "::" + split[1];
        objName = split[0];
        methodName = split[1];
        isMethod = true;
        break;
      default:
        // do nothing
        searchName = symbolName;
        objName = "";
        methodName = "";
        break;
    }

    return {
      name: symbolName,
      searchName: searchName,
      objName: objName,
      methodName: methodName,
      isMethod: isMethod,
      isFunction: functionFlag,
      equalBefore: equalBefore
    };
  }

  symbolizeAsDocumentSymbols(text: string): IDLDocumentSymbol[] {
    // init array of symbols
    let symbols: IDLDocumentSymbol[] = [];
    const objects: string[] = [];

    // get procedures
    symbols = symbols.concat(this._extractProcedures(text, objects));

    // must be after procedures because we need object definitions first, which are procedures
    symbols = symbols.concat(this._extractFunctions(text, objects));

    // get variable definitions
    symbols = symbols.concat(this._extractVariables(text));

    // return our symbols
    return symbols;
  }

  symbolizeAsSymbolInformation(text: string, uri: string): SymbolInformation[] {
    // init symbols
    const outSymbols: SymbolInformation[] = [];

    // process our document symbols
    this.symbolizeAsDocumentSymbols(text).forEach(symbol => {
      // create the location information
      outSymbols.push({
        name: symbol.name,
        kind: symbol.kind,
        location: Location.create(uri, symbol.range),
        containerName: ""
      });
    });

    return outSymbols;
  }
}