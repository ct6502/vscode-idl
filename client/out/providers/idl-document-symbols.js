"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const vscode_1 = require("vscode");
class IDLDocumentSymbolProvider {
    provideDocumentSymbols(doc) {
        return __awaiter(this, void 0, void 0, function* () {
            return getDocumentSymbols(doc);
        });
    }
}
exports.IDLDocumentSymbolProvider = IDLDocumentSymbolProvider;
function processDocument(doc) {
    try {
        return [];
    }
    catch (error) {
        return [];
    }
}
exports.processDocument = processDocument;
function resolveType(match) {
    switch (true) {
        case match.includes("::"):
            return vscode.SymbolKind.Method;
            break;
        case match.toLowerCase().endsWith("__define"):
            return vscode.SymbolKind.Class;
            break;
        default:
            return vscode.SymbolKind.Function;
    }
}
function getDocumentSymbols(doc) {
    const text = doc.getText();
    // init array of symbols
    const symbols = [];
    // find all function definitions
    const funcRegex = /(?<=^\s*function\s)[a-z_][a-z_$0-9:]*/gim;
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
            const range = new vscode.Range(new vscode.Position(lineNumber, start), new vscode.Position(lineNumber, start + m.length));
            const symbol = new vscode_1.DocumentSymbol(match, "Function", resolveType(match), range, range);
            symbols.push(symbol);
        });
    }
    // find all procedure definitions
    const proRegex = /(?<=^\s*pro\s)[a-z_][a-z_$0-9:]*/gim;
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
            const range = new vscode.Range(new vscode.Position(lineNumber, start), new vscode.Position(lineNumber, start + m.length));
            const symbol = new vscode_1.DocumentSymbol(match, "Procedure", resolveType(match), range, range);
            symbols.push(symbol);
        });
    }
    return symbols;
}
exports.getDocumentSymbols = getDocumentSymbols;
//# sourceMappingURL=idl-document-symbols.js.map