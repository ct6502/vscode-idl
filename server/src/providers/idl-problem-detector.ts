import {
  Connection,
  TextDocuments,
  Diagnostic,
  DiagnosticSeverity,
  SymbolKind
} from "vscode-languageserver";
import { IDLDocumentSymbolManager } from "./idl-document-symbol-manager";
import { IProblems } from "../core/problems.interface";
import { IDLRoutineHelper } from "./idl-routine-helper";

export class IDLProblemDetector {
  connection: Connection;
  documents: TextDocuments;
  manager: IDLDocumentSymbolManager;
  helper: IDLRoutineHelper;
  problems: IProblems = {};

  constructor(
    connection: Connection,
    documents: TextDocuments,
    manager: IDLDocumentSymbolManager,
    helper: IDLRoutineHelper
  ) {
    this.connection = connection;
    this.documents = documents;
    this.manager = manager;
    this.helper = helper;
  }

  private _resolveRoutineProblems() {
    // get all of our symbols
    const symbols = this.manager.symbols;

    // process each symbol
    Object.keys(symbols).forEach(symbolKey => {
      // extract our symbol
      const symbol = symbols[symbolKey];

      // only process this symbol if we have more than one matching symbol
      if (symbol.length > 0) {
        // we need to compare each symbol to each other symbol
        for (let i = 0; i < symbol.length; i++) {
          const ref = symbol[i];

          // check skip conditions
          if (ref.symbol.kind === SymbolKind.Constant) {
            continue
          }

          // check if we are a conflict for ENVI or IDL routines
          switch (true) {
            // validate class definitions
            case ref.symbol.detail.includes("(class definition)"):
              if (this.helper.procedures[ref.symbol.name.toLowerCase()]) {
                if (!this.problems[ref.uri]) {
                  this.problems[ref.uri] = [];
                }
                // save for reference
                this.problems[ref.uri].push({
                  severity: DiagnosticSeverity.Error,
                  range: ref.symbol.range,
                  message:
                    "Duplicate object definition conflicts with existing, core ENVI + IDL object",
                  source: "Internal or core ENVI + IDL"
                });
              }
              break;
            // validate function definitions
            case ref.symbol.detail.includes("Function"):
              if (this.helper.functions[ref.symbol.name.toLowerCase()]) {
                if (!this.problems[ref.uri]) {
                  this.problems[ref.uri] = [];
                }
                // save for reference
                this.problems[ref.uri].push({
                  severity: DiagnosticSeverity.Error,
                  range: ref.symbol.range,
                  message:
                    "Duplicate function definition conflicts with existing, core ENVI + IDL function",
                  source: "Internal or core ENVI + IDL"
                });
              }
              break;
            // validate procedure definitions
            case ref.symbol.detail.includes("Procedure"):
              if (this.helper.procedures[ref.symbol.name.toLowerCase()]) {
                if (!this.problems[ref.uri]) {
                  this.problems[ref.uri] = [];
                }
                // save for reference
                this.problems[ref.uri].push({
                  severity: DiagnosticSeverity.Error,
                  range: ref.symbol.range,
                  message:
                    "Duplicate procedure definition conflicts with existing, core ENVI + IDL procedure",
                  source: "Internal or core ENVI + IDL"
                });
              }
              break;
            default: // do nothing
          }

          // compare to all other symbols if we have more than one
          if (symbol.length > 1) {
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
                    severity: DiagnosticSeverity.Error,
                    range: ref.symbol.range,
                    message: "Duplicate routine definition",
                    source: ""
                  });

                  // save for compare
                  this.problems[compare.uri].push({
                    severity: DiagnosticSeverity.Error,
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
