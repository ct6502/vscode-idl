import { CompletionItem } from "vscode-languageserver";

// all keys are strings of the index to access our item

export interface IPropertyItem {
  [key: string]: string; // key name of property, value is the IDL data type
}

export interface IProperties {
  [key: string]: IPropertyItem; // key is string of data above
}

export interface IFunctions {
  [key: string]: boolean; // key is string of data from above
}

export interface IProcedures {
  [key: string]: boolean; // key is string of data from above
}

export interface IMethods {
  [key: string]: boolean; // key is string of data from above
}

export interface ILinks {
  [key: string]: string; // key is string of data from above, value is sub-link on docs center to find more information
}

export interface IRoutines {
  docs: CompletionItem[];
  properties: IProperties;
  links: ILinks;
  functions: IFunctions;
  procedures: IProcedures;
  methods: IMethods;
}
