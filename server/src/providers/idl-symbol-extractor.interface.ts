import { DocumentSymbol } from 'vscode-languageserver';

export interface IDLDocumentSymbol extends DocumentSymbol {
  displayName?: string;
  next?: string;
}

export interface ISelectedWord {
  name: string; // full word (including method accessors) that we have selected
  searchName: string; // if method, includes '::' and the method name for searching
  objName: string; // if method, the variable name we came from
  methodName: string; // if method, the method that we are calling
  isFunction: boolean; // indicates if we are a function or not
  isMethod: boolean; // indicates  if we are a method or not
  equalBefore: boolean; // if there is an equal sign on the line before our symbol that we found
}
