"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_languageserver_1 = require("vscode-languageserver");
// if we have a method, make it clear we have that in the document description string
function resolveRoutineNameAdd(match) {
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
function resolveRoutineType(match) {
    switch (true) {
        case match.includes("::"):
            return vscode_languageserver_1.SymbolKind.Method;
            break;
        case match.toLowerCase().endsWith("__define"):
            return vscode_languageserver_1.SymbolKind.Class;
            break;
        default:
            return vscode_languageserver_1.SymbolKind.Function;
    }
}
class IDLDocumentSymbolExtractor {
    constructor() { }
    _extractFunctions(text) {
        // init symbols
        const symbols = [];
        // find all function definitions
        const funcRegex = /(?<=^\s*function[\s]+)[a-z_][a-z_$0-9:]*/gim;
        let m;
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
                const range = vscode_languageserver_1.Range.create(vscode_languageserver_1.Position.create(lineNumber, start), vscode_languageserver_1.Position.create(lineNumber, start + match.length));
                const symbol = vscode_languageserver_1.DocumentSymbol.create(match, "Function" + resolveRoutineNameAdd(match), resolveRoutineType(match), range, range);
                symbols.push(symbol);
            });
        }
        // return our symbols
        return symbols;
    }
    _extractProcedures(text) {
        // init symbols
        const symbols = [];
        // find all procedure definitions
        const proRegex = /(?<=^\s*pro[\s]+)[a-z_][a-z_$0-9:]*/gim;
        let m;
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
                const range = vscode_languageserver_1.Range.create(vscode_languageserver_1.Position.create(lineNumber, start), vscode_languageserver_1.Position.create(lineNumber, start + match.length));
                const symbol = vscode_languageserver_1.DocumentSymbol.create(match, "Procedure" + resolveRoutineNameAdd(match), resolveRoutineType(match), range, range);
                symbols.push(symbol);
            });
        }
        // return our symbols
        return symbols;
    }
    getSelectedWord(line, position) {
        // placeholder for the name
        let symbolName = "";
        // split by words to extract our symbol that we may have clicked on
        // TODO: add logic for objects and methods here, func/pro are good for now
        const wordRegEx = /[a-z_][a-z0-9_$]*/gim;
        let m;
        while ((m = wordRegEx.exec(line)) !== null) {
            // This is necessary to avoid infinite loops with zero-width matches
            if (m.index === wordRegEx.lastIndex) {
                wordRegEx.lastIndex++;
            }
            for (let i = 0; i < m.length; i++) {
                const idx = line.indexOf(m[i]);
                if (idx !== -1) {
                    // check if we have a match
                    if (idx < position.character &&
                        idx + m[i].length > position.character) {
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
    symbolizeAsDocumentSymbols(text, uri) {
        // init array of symbols
        let symbols = [];
        symbols = symbols.concat(this._extractFunctions(text));
        symbols = symbols.concat(this._extractProcedures(text));
        // return our symbols
        return symbols;
    }
    symbolizeAsSymbolInformation(text, uri) {
        // init symbols
        const outSymbols = [];
        // process our document symbols
        this.symbolizeAsDocumentSymbols(text, uri).forEach(symbol => {
            // create the location information
            outSymbols.push({
                name: symbol.name,
                kind: symbol.kind,
                location: vscode_languageserver_1.Location.create(uri, symbol.range),
                containerName: ""
            });
        });
        return outSymbols;
    }
}
exports.IDLDocumentSymbolExtractor = IDLDocumentSymbolExtractor;
//# sourceMappingURL=idl-document-symbol-extractor.js.map