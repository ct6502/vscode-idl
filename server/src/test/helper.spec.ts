import * as path from "path";
import { DocumentSymbolParams } from "vscode-languageserver";

export function GetTestDirectory(): string {
  return __dirname + path.sep;
}

export function FileToDocumentSymbolParams(uri: string): DocumentSymbolParams {
  return { textDocument: { uri: uri } };
}

export function ReturnTestFile(name: string): string {
  return GetTestDirectory() + name;
}
