"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_languageserver_1 = require("vscode-languageserver");
class IDLProblemDetector {
    constructor(connection, documents, manager) {
        this.problems = {};
        this.connection = connection;
        this.documents = documents;
        this.manager = manager;
    }
    _resolveRoutineProblems() {
        // get all of our symbols
        const symbols = this.manager.symbols;
        // process each symbol
        Object.keys(symbols).forEach(symbolKey => {
            // extract our symbol
            const symbol = symbols[symbolKey];
            // only process this symbol if we have more than one matching symbol
            if (symbol.length > 1) {
                // we need to compare each symbol to each other symbol
                for (let i = 0; i < symbol.length; i++) {
                    const ref = symbol[i];
                    for (let j = i + 1; j < symbol.length; j++) {
                        const compare = symbol[j];
                        // check if we have something to report
                        switch (true) {
                            // matching symbol and detail, detail is used to delineate function from procedure
                            case ref.symbol.kind === compare.symbol.kind &&
                                ref.symbol.detail === compare.symbol.detail:
                                // make sure we have arrays
                                if (!this.problems[ref.uri]) {
                                    this.problems[ref.uri] = [];
                                }
                                if (!this.problems[compare.uri]) {
                                    this.problems[compare.uri] = [];
                                }
                                // save for reference
                                this.problems[ref.uri].push({
                                    severity: vscode_languageserver_1.DiagnosticSeverity.Error,
                                    range: ref.symbol.range,
                                    message: "Duplicate routine definition",
                                    source: ""
                                });
                                // save for compare
                                this.problems[compare.uri].push({
                                    severity: vscode_languageserver_1.DiagnosticSeverity.Error,
                                    range: compare.symbol.range,
                                    message: "Duplicate routine definition",
                                    source: ""
                                });
                                break;
                            default:
                            // do nothing
                        }
                    }
                }
            }
        });
    }
    // detect problems and send to the client
    detectAndSendProblems() {
        // get existing problem URIs and check if we need to remove problems that
        // have been fixed
        const existing = Object.keys(this.problems);
        // clear problems
        this.problems = {};
        // resolve all problems
        this._resolveRoutineProblems();
        // send all problems
        Object.keys(this.problems).forEach(uri => {
            this.connection.sendDiagnostics({
                uri: uri,
                diagnostics: this.problems[uri]
            });
        });
        // if we have files that the problems have been fixed for
        // then we should clear our the issues so we send empty array
        existing.forEach(uri => {
            if (!this.problems[uri]) {
                this.connection.sendDiagnostics({
                    uri: uri,
                    diagnostics: []
                });
            }
        });
    }
}
exports.IDLProblemDetector = IDLProblemDetector;
//# sourceMappingURL=idl-problem-detector.js.map