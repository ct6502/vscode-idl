import { DiagnosticSeverity, SymbolKind } from "vscode-languageserver";
import { IProblems } from "../core/problems.interface";
import { IDL } from "./idl";

export class IDLProblemDetector {
  idl: IDL;
  problems: IProblems = {};
  previousProblems: string[] = []; // previous problems that we have to cleanif they are no longer problems

  constructor(idl: IDL) {
    this.idl = idl;
    this.problems = {};
  }

  private _detectRoutineNameProblems() {
    // get all of our symbols
    const symbols = this.idl.manager.symbols;

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
          if (ref.symbol.kind === SymbolKind.Variable) {
            continue;
          }

          // check if we are a conflict for ENVI or IDL routines
          switch (true) {
            // validate class definitions
            case ref.symbol.detail.includes("(class definition)"):
              if (this.idl.helper.procedures[ref.symbol.name.toLowerCase()]) {
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
              if (this.idl.helper.functions[ref.symbol.name.toLowerCase()]) {
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
              if (this.idl.helper.procedures[ref.symbol.name.toLowerCase()]) {
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

  // detect all problems, calls the specific methods above
  _detectProblems() {
    // save existing problem keys, or add to existing lookup
    // here just in case we call this twice, dont want to lose problem iniformation
    // cleared when we send problems
    if (this.previousProblems.length === 0) {
      this.previousProblems = Object.keys(this.problems);
    } else {
      this.previousProblems = this.previousProblems.concat(Object.keys(this.problems));
    }

    // clear problems
    this.problems = {};

    // detect name conflicts
    this._detectRoutineNameProblems();
  }

  // wrapper to send problems to our connection
  _sendProblems() {
    // send all problems
    Object.keys(this.problems).forEach(uri => {
      this.idl.connection.sendDiagnostics({
        uri: uri,
        diagnostics: this.problems[uri]
      });
    });

    // check if previous problems have been fixed and, if so, then
    // let our connection know it is good to go
    this.previousProblems.forEach(uri => {
      if (!this.problems[uri]) {
        this.idl.connection.sendDiagnostics({
          uri: uri,
          diagnostics: []
        });
      }
    });

    // clear previous problems as we have sent all of them already
    this.previousProblems = [];
  }

  // detect problems and send to the client
  detectProblems() {
    // detect problems
    this._detectProblems();
  }

  // detect problems and send to the client
  detectAndSendProblems() {
    // detect problems
    this._detectProblems();

    // send the problems, yo
    this._sendProblems();
  }
}
