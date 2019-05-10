import * as vscode from 'vscode';
import { SymbolInformation, TextDocument, DocumentSymbol } from 'vscode';

export class IDLDocumentSymbolProvider implements vscode.DocumentSymbolProvider {
  public async provideDocumentSymbols(doc: TextDocument): Promise<DocumentSymbol[]> {
    return getDocumentSymbols(doc);
  }
}

export function processDocument(doc: TextDocument): SymbolInformation[] {
  try {
    return [];
  } catch (error) {
    return [];
  }
}

function resolveType(match:string): vscode.SymbolKind {
  switch (true) {
    case match.includes('::'):
      return vscode.SymbolKind.Method;
      break;
    case match.toLowerCase().endsWith('__define'):
      return vscode.SymbolKind.Class;
      break;
    default:
      return vscode.SymbolKind.Function;
  }
}

export function getDocumentSymbols(doc: TextDocument): DocumentSymbol[] {
  const text = doc.getText();

  // init array of symbols
  const symbols: DocumentSymbol[] = [];

  // find all function definitions
  const funcRegex = /(?<=^\s*function\s)[a-z_][a-z_$0-9:]*/gmi;
  let m: RegExpExecArray;
  while ((m = funcRegex.exec(text)) !== null) {
      // This is necessary to avoid infinite loops with zero-width matches
      if (m.index === funcRegex.lastIndex) {
        funcRegex.lastIndex++;
      }

      // get the line of this character
      const split = text.substr(0, m.index).split('\n')
      const lineNumber = split.length - 1;
      const start = split[split.length-1].length; // length of string start
      
      // The result can be accessed through the `m`-variable.
      m.forEach((match, groupIndex) => {
        const range = new vscode.Range(new vscode.Position(lineNumber, start), new vscode.Position(lineNumber, start + m.length));
        const symbol = new DocumentSymbol(match, 'Function', resolveType(match), range, range);
        symbols.push(symbol);
      });
    }

    // find all procedure definitions
    const proRegex = /(?<=^\s*pro\s)[a-z_][a-z_$0-9:]*/gmi;
    while ((m = proRegex.exec(text)) !== null) {
      // This is necessary to avoid infinite loops with zero-width matches
      if (m.index === proRegex.lastIndex) {
        proRegex.lastIndex++;
      }

      // get the line of this character
      const split = text.substr(0, m.index).split('\n')
      const lineNumber = split.length - 1;
      const start = split[split.length-1].length; // length of string start
      
      // The result can be accessed through the `m`-variable.
      m.forEach((match, groupIndex) => {
        const range = new vscode.Range(new vscode.Position(lineNumber, start), new vscode.Position(lineNumber, start + m.length));
        const symbol = new DocumentSymbol(match, 'Procedure', resolveType(match), range, range);
        symbols.push(symbol);
      });
    }

    return symbols;
}