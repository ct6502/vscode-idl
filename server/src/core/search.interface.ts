import { CompletionItem } from "vscode-languageserver";

export interface IQuickLookup {
  functions: CompletionItem[];
  procedures: CompletionItem[];
  functionMethods: CompletionItem[];
  procedureMethods: CompletionItem[];
}

export interface IQuickSearchLookup {
  functions: Fuzzysort.Prepared[];
  procedures: Fuzzysort.Prepared[];
  functionMethods: Fuzzysort.Prepared[];
  procedureMethods: Fuzzysort.Prepared[];
}
