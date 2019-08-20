import {
  SymbolInformation,
  DocumentSymbol,
  SymbolKind,
  Location,
  Range,
  Position
} from "vscode-languageserver";

export interface IDLDocumentSymbol extends DocumentSymbol {
  displayName?: string;
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

export class IDLDocumentSymbolExtractor {
  constructor() {}

  private _extractFunctions(
    text: string,
    objects: string[]
  ): IDLDocumentSymbol[] {
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
          symbol.displayName = symbol.displayName.substr(
            symbol.displayName.indexOf(":")
          );
        }
      });
    }

    // return our symbols
    return symbols;
  }

  private _extractProcedures(
    text: string,
    objects: string[]
  ): IDLDocumentSymbol[] {
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
          symbol.displayName = symbol.displayName.substr(
            symbol.displayName.indexOf(":")
          );
        }
      });
    }

    // return our symbols
    return symbols;
  }

  getSelectedWord(line: string, position: Position): string {
    // placeholder for the name
    let symbolName = "";

    // split by words to extract our symbol that we may have clicked on
    // TODO: add logic for objects and methods here, func/pro are good for now
    const wordRegEx = /[a-z_][a-z0-9_$]*/gim;
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
          if (
            idx < position.character &&
            idx + m[i].length > position.character
          ) {
            symbolName = m[i];
            break;
          }
        }
      }
      if (symbolName !== "") {
        break;
      }
    }

    return symbolName;
  }

  symbolizeAsDocumentSymbols(text: string, uri: string): IDLDocumentSymbol[] {
    // init array of symbols
    let symbols: IDLDocumentSymbol[] = [];
    const objects: string[] = [];
    symbols = symbols.concat(this._extractProcedures(text, objects));

    // must be second because we need object definitions first, which are procedures
    symbols = symbols.concat(this._extractFunctions(text, objects));

    // return our symbols
    return symbols;
  }

  symbolizeAsSymbolInformation(text: string, uri: string): SymbolInformation[] {
    // init symbols
    const outSymbols: SymbolInformation[] = [];

    // process our document symbols
    this.symbolizeAsDocumentSymbols(text, uri).forEach(symbol => {
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
