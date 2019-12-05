import { CompletionItem } from 'vscode-languageserver';

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

export interface IQuickLookupObj {
  functions: { [key: string]: CompletionItem };
  procedures: { [key: string]: CompletionItem };
  functionMethods: { [key: string]: CompletionItem };
  procedureMethods: { [key: string]: CompletionItem };
}

export interface IQuickSearchLookupObj {
  functions: { [key: string]: Fuzzysort.Prepared };
  procedures: { [key: string]: Fuzzysort.Prepared };
  functionMethods: { [key: string]: Fuzzysort.Prepared };
  procedureMethods: { [key: string]: Fuzzysort.Prepared };
}
