import { Connection, TextDocuments } from "vscode-languageserver";
import { IDLSymbolExtractor } from "./idl-symbol-extractor";
import { IDLRoutineHelper } from "./idl-routine-helper";
import { IDLProblemDetector } from "./idl-problem-detector";
import { IDLSymbolManager } from "./idl-symbol-manager";

export class IDL {
    // connection specific properties for vscode lang server
    documents: TextDocuments;
    connection: Connection;

    // all of our IDL helper objects
    helper: IDLRoutineHelper;                // internal routine helper
    problems: IDLProblemDetector;     // problems
    manager: IDLSymbolManager;            // manage all symbols from all docs and workspaces
    extractor: IDLSymbolExtractor         // load symbols from a file

    constructor(documents: TextDocuments, connection?: Connection) {
        this.documents = documents;
        if (connection) { this.connection = connection };

        // create all of our child objects
        this.helper = new IDLRoutineHelper(this);
        this.problems = new IDLProblemDetector(this);
        this.manager = new IDLSymbolManager(this);
        this.extractor = new IDLSymbolExtractor(this);
    }
}