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
const vscode_languageserver_1 = require("vscode-languageserver");
const moize_1 = require("moize");
const idl_document_symbol_extractor_1 = require("./idl-document-symbol-extractor");
// get our globby code
const glob = require("glob-fs")({ gitignore: true }); // file searching
const vscode_uri_1 = require("vscode-uri"); // handle URI to file system and back
const path = require("path"); // path separator
const fuzzysort = require("fuzzysort"); // search through the symbols
const fs_1 = require("fs"); // read text file from disk
// options for controlling search performance
const searchOptions = {
    limit: 10,
    allowTypo: true // if you don't care about allowing typos
    // threshold: -10000 // don't return bad results
};
class IDLDocumentSymbolManager {
    constructor(connection, documents) {
        this.symbols = {};
        this.symbolKeys = [];
        this.symbolKeysSearch = [];
        // define our getters for extracting document information
        this.get = {
            documentSymbols: moize_1.default((uri) => __awaiter(this, void 0, void 0, function* () {
                return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                    try {
                        // get the strings we are processing
                        const text = this._getStrings(uri);
                        // extract symbols
                        const foundSymbols = this.extractor.symbolizeAsDocumentSymbols(text, uri);
                        foundSymbols.forEach(symbol => {
                            // make our symbol lookup information
                            const info = {
                                uri: uri,
                                symbol: symbol
                            };
                            // get the key
                            const key = symbol.name.toLowerCase();
                            // save in our lookup table
                            if (this.symbols[key]) {
                                this.symbols[key].push(info);
                            }
                            else {
                                this.symbols[key] = [info];
                                this.symbolKeys.push(key);
                                this.symbolKeysSearch.push(fuzzysort.prepare(key));
                            }
                        });
                        resolve(foundSymbols);
                    }
                    catch (err) {
                        reject(err);
                    }
                }));
            }), { maxSize: 1000, isPromise: true }),
            documentSymbolInformation: moize_1.default((uri) => __awaiter(this, void 0, void 0, function* () {
                return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                    try {
                        const text = this._getStrings(uri);
                        resolve(this.extractor.symbolizeAsSymbolInformation(text, uri));
                    }
                    catch (err) {
                        reject(err);
                    }
                }));
            }), { maxSize: 1000, isPromise: true })
        };
        this.moizes = this.get;
        this.connection = connection;
        this.documents = documents;
        this.extractor = new idl_document_symbol_extractor_1.IDLDocumentSymbolExtractor();
    }
    // search all of our symbols by name to find what we have
    searchByName(query) {
        // get the keys that match
        const results = fuzzysort
            .go(query, this.symbolKeysSearch, searchOptions)
            .map(match => this.symbols[match.target]);
        // map all potential matches to a single array with lookup information
        // each symbol has an array of matches because we could have multiple definitions
        const symbolInfo = [];
        results.forEach(symbols => {
            symbols.forEach(lookup => {
                symbolInfo.push({
                    name: lookup.symbol.name,
                    kind: lookup.symbol.kind,
                    location: vscode_languageserver_1.Location.create(lookup.uri, lookup.symbol.range),
                    containerName: ""
                });
            });
        });
        return symbolInfo;
    }
    // search for symbols by line
    searchByLine(params) {
        // read the strings from our text document
        const line = this._getStrings(params.textDocument.uri).split("\n")[params.position.line];
        // create a placeholder to return
        let placeholder = null;
        // get the symbol highlighted
        const symbolName = this.extractor.getSelectedWord(line, params.position);
        // make sure that we only have one match, no idea why we wouldn't have a match here
        if (symbolName !== "") {
            const symbols = this.searchByName(symbolName);
            // make sure that we have only one match
            if (symbols.length > 0) {
                if (symbols[0].name.toLowerCase() === symbolName.toLowerCase()) {
                    placeholder = symbols[0].location;
                }
            }
        }
        return placeholder;
    }
    // when we remove a document, clean up the symbol lookup information
    _removeSymbols(uri, symbols) {
        symbols.forEach(symbol => {
            // get the key
            const key = symbol.name.toLowerCase();
            // clean up a single entry
            if (this.symbols[key].length === 1) {
                const idx = this.symbolKeys.indexOf(key);
                // remove the lookup
                if (idx !== -1) {
                    this.symbolKeys.splice(idx, 1);
                    this.symbolKeysSearch.splice(idx, 1);
                }
                delete this.symbols[key];
            }
            else {
                // init index
                let remove = [];
                // TODO: for more than function names, use some rigor for matching symbols
                // as we can have multiple symbols with the same name that are different entities
                // compare each document with a match for that symbol
                this.symbols[key].forEach((docMatch, dIdx) => {
                    if (docMatch.uri === uri) {
                        remove.push(dIdx);
                    }
                });
                // delete if we found a match
                if (remove.length > 0) {
                    remove.reverse();
                    remove.forEach(idx => {
                        this.symbols[key].splice(idx, 1);
                    });
                }
            }
        });
    }
    // wrapper for removing a document
    remove(uri) {
        return __awaiter(this, void 0, void 0, function* () {
            // check if we need to remove it from the symbol list
            if (this.moizes.documentSymbols.has([uri])) {
                // get our symbols and clean up
                const symbols = yield this.get.documentSymbols(uri);
                // clean up our symbol information
                this._removeSymbols(uri, symbols);
                // clear cache
                this.moizes.documentSymbols.remove([uri]);
            }
        });
    }
    // remove existing and then regenerate our symbols
    update(uri) {
        return __awaiter(this, void 0, void 0, function* () {
            // clean up existing
            yield this.remove(uri);
            // get updated
            return yield this.get.documentSymbols(uri);
        });
    }
    // wrapper that uses the text document synchronization to update symbols
    // for all files managed by the VScode instance
    indexWorkspaces(folders) {
        return __awaiter(this, void 0, void 0, function* () {
            const promises = [];
            // get the current folder
            const firstDir = process.cwd();
            // process each folder
            folders.forEach(folder => {
                // get path as actual folder, fix windows symbols from HTML
                const folderPath = vscode_uri_1.default.parse(folders[0].uri).fsPath;
                // this.connection.console.log(folderPath);
                process.chdir(folderPath);
                const files = glob.readdirSync("**/*.pro");
                // process each file
                files.forEach(file => {
                    // get the URI as a string
                    const uriStr = vscode_uri_1.default.file(folderPath + path.sep + file).toString();
                    promises.push(this.get.documentSymbols(uriStr));
                });
            });
            // change back to the fiest directory
            process.chdir(firstDir);
            // wait to finish indexing all documents
            yield Promise.all(promises);
        });
    }
    _getStrings(uri) {
        // init return value
        let strings = "";
        // get the document we are processing
        const doc = this.documents.get(uri);
        if (doc !== undefined) {
            strings = doc.getText();
        }
        else {
            const parsed = vscode_uri_1.default.parse(uri);
            strings = fs_1.readFileSync(parsed.fsPath, "utf8");
        }
        return strings;
    }
}
exports.IDLDocumentSymbolManager = IDLDocumentSymbolManager;
//# sourceMappingURL=idl-document-symbol-manager.js.map