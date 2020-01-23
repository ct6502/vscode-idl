import { CompletionItemKind, SymbolKind } from 'vscode-languageserver';

// if we have a method, make it clear we have that in the document description string
export function resolveRoutineNameAdd(match: string): string {
  switch (true) {
    case match.includes('::'):
      return ' method';
    case match.toLowerCase().endsWith('__define'):
      return ' (class definition)';
    default:
      return '';
  }
}

// get the proper symbol type for what we found, just for routines now
export function resolveRoutineType(match: string): SymbolKind {
  switch (true) {
    case match.includes('::'):
      return SymbolKind.Method;
    case match.toLowerCase().endsWith('__define'):
      return SymbolKind.Class;
    default:
      return SymbolKind.Function;
  }
}

// get the proper symbol type for what we found, just for routines now
export function resolveCompletionItemKind(symbol: SymbolKind): CompletionItemKind {
  switch (symbol) {
    case SymbolKind.Method:
      return CompletionItemKind.Method;
    case SymbolKind.Class:
      return CompletionItemKind.Class;
    case SymbolKind.Function:
      return CompletionItemKind.Function;
    case SymbolKind.Variable:
      return CompletionItemKind.Variable;
    default:
      return CompletionItemKind.Text;
  }
}
