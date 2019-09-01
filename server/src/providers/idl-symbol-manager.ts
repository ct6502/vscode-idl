import {
  SymbolInformation,
  DocumentSymbol,
  SymbolKind,
  Location,
  WorkspaceFolder,
  TextDocumentPositionParams,
  Definition,
  CompletionItem
} from "vscode-languageserver";
import moize from "moize";
import { IDLDocumentSymbol, resolveCompletionItemKind } from "./idl-symbol-extractor";

// get our globby code
const glob = require("glob-fs")({ gitignore: true }); // file searching
import Uri from "vscode-uri"; // handle URI to file system and back
import path = require("path"); // path separator
import fuzzysort = require("fuzzysort"); // search through the symbols
import { readFileSync } from "fs"; // read text file from disk
import { IDL } from "./idl";

// options for controlling search performance
const searchOptions = {
  limit: 10, // don't return more results than you need!
  allowTypo: true // if you don't care about allowing typos
  // threshold: -10000 // don't return bad results
};

// options for controlling search performance
const completionOptions = {
  limit: 50, // don't return more results than you need!
  allowTypo: true // if you don't care about allowing typos
  // threshold: -10000 // don't return bad results
};

// define structure for our moize searches to cache the promises for async documentation generation
interface ISearches {
  documentSymbols: (uri: string) => Promise<IDLDocumentSymbol[]>;
  documentSymbolInformation: (uri: string) => Promise<SymbolInformation[]>;
}

// cache symbol information for the document
export interface IMoizes {
  documentSymbols: any;
  documentSymbolInformation: any;
}

// store location of symbol and the symbol
interface ISymbolLookup {
  uri: string;
  symbol: DocumentSymbol;
}

export class IDLSymbolManager {
  idl: IDL;
  symbols: { [key: string]: ISymbolLookup[] } = {};
  symbolKeys: string[] = [];
  symbolKeysSearch: any[] = [];

  // Track constants by file and routines by all files we have opened
  constantCompletionLookup: { [key: string]: CompletionItem[] } = {};
  routineCompletionLookup: { [key: string]: CompletionItem } = {};
  routineSymbolLookup: { [key: string]: DocumentSymbol } = {};

  constructor(idl: IDL) {
    this.idl = idl;
  }

  // search all of our symbols by name to find what we have
  findSymbolsByName(query: string): SymbolInformation[] {
    // get the keys that match
    const results = fuzzysort
      .go(query, this.symbolKeysSearch, searchOptions)
      .map(match => this.symbols[match.target]);

    // map all potential matches to a single array with lookup information
    // each symbol has an array of matches because we could have multiple definitions
    const symbolInfo: SymbolInformation[] = [];
    results.forEach(symbols => {
      // process all matches for that symbol name
      symbols.forEach(lookup => {
        symbolInfo.push({
          name: lookup.symbol.name,
          kind: lookup.symbol.kind,
          location: Location.create(lookup.uri, lookup.symbol.range),
          containerName: ""
        });
      });
    });
    return symbolInfo;
  }

  // handle completion items
  // return items from the docs for completion
  completion(
    query: string,
    _textDocumentPosition: TextDocumentPositionParams,
    optimized = false
  ): CompletionItem[] {
    // get the file we are in
    const uri = _textDocumentPosition.textDocument.uri;

    // init return value
    let items: CompletionItem[] = [];

    // get constants for our file
    if (uri in this.constantCompletionLookup) {
      items = this.constantCompletionLookup[uri];
    }

    // merge with all of our symbols if we have user routines
    if (Object.keys(this.routineCompletionLookup).length > 0) {
      let add: CompletionItem[] = [];

      // are we searching, or just returning everything that we have?
      if (!optimized) {
        // not optimized, so return everything we have
        add = Object.values(this.routineCompletionLookup);
      } else {
        // search for symbols, dont just return everything
        const results = fuzzysort
          .go(query, this.symbolKeysSearch, searchOptions)
          .map(match => this.symbols[match.target]);

        // make sure we only send one symbol with the same name at a time, could get crazy with larger workspaces
        const foundSymbols = [];

        // get our completion items
        const items: CompletionItem[] = [];
        results.forEach(symbols => {
          symbols.forEach(lookup => {
            // make sure we dont have another sy,bol with this name, should allow for functions and procedures through
            if (foundSymbols.indexOf(lookup.symbol.name) === -1) {
              let ok = true;

              // only show variables within the document we are searching from
              if (
                lookup.symbol.kind === SymbolKind.Variable &&
                lookup.uri !== _textDocumentPosition.textDocument.uri
              ) {
                ok = false;
              }

              // check if we can show it
              if (ok) {
                foundSymbols.push(lookup.symbol.name);
                add.push({
                  label: lookup.symbol.name,
                  kind: resolveCompletionItemKind(lookup.symbol.kind)
                });
              }
            }
          });
        });
      }

      // check howwe need to include our additional symbols
      if (items.length === 0) {
        items = add;
      } else {
        items = items.concat(add);
      }
    }

    return items;
  }

  getSelectedSymbol(params: TextDocumentPositionParams): { name: string; isFunction: boolean } {
    // read the strings from our text document
    const line = this._getStrings(params.textDocument.uri).split("\n")[params.position.line];

    // get the symbol highlighted
    return this.idl.extractor.getSelectedWord(line, params.position);
  }

  // search for symbols by line
  findSymbolDefinition(params: TextDocumentPositionParams, limit = true): Definition {
    // get the highlighted symbol name
    const res = this.getSelectedSymbol(params);
    let symbolName = res.name.toLowerCase();
    const functionFlag = res.isFunction;

    // check if we need to clean up the name
    switch (true) {
      case symbolName.includes("."):
        symbolName = "::" + symbolName.split(".")[1];
        break;
      case symbolName.includes("->"):
        symbolName = "::" + symbolName.split("->")[1];
        break;
      default: // do nothing
    }

    // create a placeholder to return
    let placeholder: Definition = null;

    // make sure that we only have one match, no idea why we wouldn't have a match here
    if (symbolName !== "") {
      const symbols = this.findSymbolsByName(symbolName);

      // make sure that we have only one match
      if (symbols.length > 0) {
        // are we limiting results and being strict, or loosey goosey?
        if (limit) {
          switch (true) {
            // function method
            case symbolName.includes("::") &&
              symbols[0].name.toLowerCase().endsWith(symbolName + "()") &&
              functionFlag:
              placeholder = symbols[0].location;
              break;
            // procedure method
            case symbolName.includes("::") && symbols[0].name.toLowerCase().endsWith(symbolName):
              placeholder = symbols[0].location;
              break;
            // function
            case symbols[0].name.toLowerCase() === symbolName + "()" && functionFlag:
              placeholder = symbols[0].location;
              break;
            // procedure
            case symbols[0].name.toLowerCase() === symbolName:
              placeholder = symbols[0].location;
              break;
            default: // do nothing
          }
        } else {
          placeholder = symbols[0].location;
        }
      }
    }
    return placeholder;
  }

  // when we remove a document, clean up the symbol lookup information
  private _removeSymbols(uri: string, symbols: DocumentSymbol[]) {
    // clear constant lookup
    delete this.constantCompletionLookup[uri];

    // process each symbol
    symbols.forEach(symbol => {
      // get the key
      const key = symbol.name.toLowerCase();

      // clean up routine lookup for functions and procedures
      if (key in this.routineCompletionLookup) {
        delete this.routineCompletionLookup[key];
      }
      if (key + "(" in this.routineCompletionLookup) {
        delete this.routineCompletionLookup[key + "("];
      }
      if (key in this.routineSymbolLookup) {
        delete this.routineSymbolLookup[key];
      }

      // make sure we have symbols to clean up
      if (key in this.symbols) {
        // clean up a single entry
        if (this.symbols[key].length === 1) {
          const idx = this.symbolKeys.indexOf(key);
          // remove the lookup
          if (idx !== -1) {
            this.symbolKeys.splice(idx, 1);
            this.symbolKeysSearch.splice(idx, 1);
          }
          delete this.symbols[key];
        } else {
          // init index
          let remove: number[] = [];

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
      }
    });
  }

  // wrapper for removing a document
  async remove(uri: string) {
    // check if we need to remove it from the symbol list
    if (this.moizes.documentSymbols.has([uri])) {
      // get our symbols and clean up
      const symbols = await this.get.documentSymbols(uri);

      // clean up our symbol information
      this._removeSymbols(uri, symbols);

      // clear cache
      this.moizes.documentSymbols.remove([uri]);
    }
  }

  // remove existing and then regenerate our symbols
  async update(uri: string): Promise<DocumentSymbol[]> {
    // clean up existing
    await this.remove(uri);

    // get updated
    return await this.get.documentSymbols(uri);
  }

  // wrapper that uses the text document synchronization to update symbols
  // for all files managed by the VScode instance
  async indexWorkspaces(folders: WorkspaceFolder[]) {
    const promises: Promise<any>[] = [];

    // get the current folder
    const firstDir = process.cwd();

    // process each folder
    folders.forEach(folder => {
      // get path as actual folder, fix windows symbols from HTML
      const folderPath = Uri.parse(folder.uri).fsPath;

      process.chdir(folderPath);
      const files: string[] = glob
        .readdirSync("**/*.pro")
        .filter(files => !files.toLowerCase().endsWith(".spec.pro"));

      // process each file
      files.forEach(file => {
        // get the URI as a string
        const uriStr = Uri.file(folderPath + path.sep + file).toString();
        promises.push(this.get.documentSymbols(uriStr));
      });
    });

    // change back to the fiest directory
    process.chdir(firstDir);

    // wait to finish indexing all documents
    await Promise.all(promises);
  }

  private _getStrings(uri: string): string {
    // init return value
    let strings = "";

    // get the document we are processing
    const doc = this.idl.documents.get(uri);
    if (doc !== undefined) {
      strings = doc.getText();
    } else {
      const parsed = Uri.parse(uri);
      strings = readFileSync(parsed.fsPath, "utf8");
    }

    return strings;
  }

  // define our getters for extracting document information
  get: ISearches = {
    documentSymbols: moize(
      async (uri: string): Promise<IDLDocumentSymbol[]> => {
        return new Promise(async (resolve, reject) => {
          try {
            // get the strings we are processing
            const text = this._getStrings(uri);

            // extract symbols
            const foundSymbols = this.idl.extractor.symbolizeAsDocumentSymbols(text);

            // process all of the symbols that we found
            foundSymbols.forEach(symbol => {
              // build the completion item for our symbol if it is not a constant
              if (symbol.kind !== SymbolKind.Variable) {
                // make our symbol lookup information
                const info: ISymbolLookup = {
                  uri: uri,
                  symbol: symbol
                };

                // get the key
                const key = symbol.name.toLowerCase();

                // save in our lookup table
                if (this.symbols[key]) {
                  this.symbols[key].push(info);
                } else {
                  this.symbols[key] = [info];
                  this.symbolKeys.push(key);
                  this.symbolKeysSearch.push(fuzzysort.prepare(key));
                }

                // save our routine symbol lookup
                this.routineSymbolLookup[key] = symbol;

                // save compeltion information
                const completionItem: CompletionItem = {
                  label: symbol.name,
                  kind: resolveCompletionItemKind(symbol.kind)
                };

                // check if our name has '::'  and just get the method name
                const split = symbol.name.split("::");
                let replaceName = "";
                if (split.length == 1) {
                  replaceName = symbol.name;
                } else {
                  replaceName = split[1];
                }

                // update name with function, procedure, method
                switch (true) {
                  case symbol.detail.includes("Function"):
                    completionItem.insertText = replaceName.substr(0, replaceName.length - 1);
                    break;
                  case symbol.detail.includes("Procedure"):
                    completionItem.insertText = replaceName + ",";
                    break;
                  default:
                    // do nothing
                    completionItem.insertText = replaceName;
                }

                // save in our routine lookup
                this.routineCompletionLookup[key] = completionItem;
              }
            });

            // save any constants that we may have found, but only if we have one by that name
            const constantNames = [];
            this.constantCompletionLookup[uri] = foundSymbols
              .filter(symbol => {
                let flag = false;
                if (symbol.kind === SymbolKind.Variable) {
                  const saveName = symbol.name.toLowerCase();
                  if (constantNames.indexOf(saveName) === -1) {
                    constantNames.push(saveName);
                    flag = true;
                  }
                }
                return flag;
              })
              .map(symbol => {
                return {
                  label: symbol.name,
                  kind: resolveCompletionItemKind(symbol.kind)
                };
              });

            resolve(foundSymbols);
          } catch (err) {
            reject(err);
          }
        });
      },
      { maxSize: 1000, isPromise: true }
    ),
    documentSymbolInformation: moize(
      async (uri: string): Promise<SymbolInformation[]> => {
        return new Promise(async (resolve, reject) => {
          try {
            const text = this._getStrings(uri);
            resolve(this.idl.extractor.symbolizeAsSymbolInformation(text, uri));
          } catch (err) {
            reject(err);
          }
        });
      },
      { maxSize: 1000, isPromise: true }
    )
  };
  moizes: IMoizes = this.get;
}
