import {
  SymbolInformation,
  TextDocument,
  DocumentSymbol,
  SymbolKind,
  Location,
  Range,
  Position,
  Connection,
  WorkspaceSymbolParams,
  TextDocuments,
  WorkspaceFolder,
  TextDocumentPositionParams,
  Definition
} from "vscode-languageserver";
import moize from "moize";
import { IDLDocumentSymbolExtractor } from "./idl-document-symbol-extractor";

// get our globby code
const glob = require("glob-fs")({ gitignore: true }); // file searching
import Uri from "vscode-uri"; // handle URI to file system and back
import path = require("path"); // path separator
import fuzzysort = require("fuzzysort"); // search through the symbols
import { readFileSync } from "fs"; // read text file from disk

// options for controlling search performance
const searchOptions = {
  limit: 10, // don't return more results than you need!
  allowTypo: true // if you don't care about allowing typos
  // threshold: -10000 // don't return bad results
};

// define structure for our moize searches to cache the promises for async documentation generation
interface ISearches {
  documentSymbols: (uri: string) => Promise<DocumentSymbol[]>;
  documentSymbolInformation: (uri: string) => Promise<SymbolInformation[]>;
}

export interface IMoizes {
  documentSymbols: any;
  documentSymbolInformation: any;
}

interface ISymbolLookup {
  uri: string;
  symbol: DocumentSymbol;
}

export class IDLDocumentSymbolManager {
  connection: Connection;
  documents: TextDocuments;
  symbols: { [key: string]: ISymbolLookup[] } = {};
  symbolKeys: string[] = [];
  symbolKeysSearch: any[] = [];
  extractor: IDLDocumentSymbolExtractor;

  constructor(connection: Connection, documents: TextDocuments) {
    this.connection = connection;
    this.documents = documents;
    this.extractor = new IDLDocumentSymbolExtractor();
  }

  // search all of our symbols by name to find what we have
  searchByName(query: string): SymbolInformation[] {
    // get the keys that match
    const results = fuzzysort
      .go(query, this.symbolKeysSearch, searchOptions)
      .map(match => this.symbols[match.target]);

    // map all potential matches to a single array with lookup information
    // each symbol has an array of matches because we could have multiple definitions
    const symbolInfo: SymbolInformation[] = [];
    results.forEach(symbols => {
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

  // search for symbols by line
  searchByLine(params: TextDocumentPositionParams): Definition {
    // read the strings from our text document
    const line = this._getStrings(params.textDocument.uri).split("\n")[
      params.position.line
    ];

    // create a placeholder to return
    let placeholder: Definition = null;

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
  private _removeSymbols(uri: string, symbols: DocumentSymbol[]) {
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
    });
  }

  // wrapper for removing a document
  async remove(uri: string) {
    // check if we need to remove it from the symbol list
    if (this.moizes.documentSymbols.has([uri])) {
      this.connection.console.log(JSON.stringify("Have cached symbols"));
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
      const folderPath = Uri.parse(folders[0].uri).fsPath;
      // this.connection.console.log(folderPath);

      process.chdir(folderPath);
      const files: string[] = glob.readdirSync("**/*.pro");

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
    const doc = this.documents.get(uri);
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
      async (uri: string): Promise<DocumentSymbol[]> => {
        return new Promise(async (resolve, reject) => {
          try {
            // get the strings we are processing
            const text = this._getStrings(uri);

            // extract symbols
            const foundSymbols = this.extractor.symbolizeAsDocumentSymbols(
              text,
              uri
            );
            foundSymbols.forEach(symbol => {
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
            resolve(this.extractor.symbolizeAsSymbolInformation(text, uri));
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
