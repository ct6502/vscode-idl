import { Diagnostic } from "vscode-languageserver";

export interface IProblems {
  [key: string]: Diagnostic[];
}
