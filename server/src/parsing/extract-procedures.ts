import { DocumentSymbol, Position, Range } from 'vscode-languageserver';
import { IDLDocumentSymbol } from '../providers/idl-symbol-extractor.interface';
import { resolveRoutineNameAdd, resolveRoutineType } from './resolve-routine-extras';

export function extractProcedures(text: string, objects: string[]): IDLDocumentSymbol[] {
  // init symbols
  const symbols: IDLDocumentSymbol[] = [];

  // find all procedure definitions
  const proRegex = /(?<=^\s*pro[\s]+)[a-z_][a-z_$0-9:]*/gim;
  let m: RegExpExecArray;
  while ((m = proRegex.exec(text)) !== null) {
    // This is necessary to avoid infinite loops with zero-width matches
    if (m.index === proRegex.lastIndex) {
      proRegex.lastIndex++;
    }

    // get the line of this character
    const split = text.substr(0, m.index).split('\n');
    const lineNumber = split.length - 1;
    const start = split[split.length - 1].length; // length of string start

    // The result can be accessed through the `m`-variable.
    m.forEach((match, groupIndex) => {
      if (groupIndex > 0) {
        return;
      }

      // check for object
      const lowMatch = match.toLowerCase();
      if (lowMatch.includes('__define')) {
        const objName = lowMatch.replace('__define', '');
        if (objects.indexOf(objName) === -1) {
          objects.push(objName);
        }
      }

      // get range
      const range = Range.create(
        Position.create(lineNumber, start),
        Position.create(lineNumber, start + match.length)
      );

      // make our symbol
      const symbol: IDLDocumentSymbol = DocumentSymbol.create(
        match,
        'Procedure' + resolveRoutineNameAdd(match),
        resolveRoutineType(match),
        range,
        range
      );

      // save the display name of our symbol, hack to get around custom IDL symbol here
      symbol.displayName = match;

      // save
      symbols.push(symbol);
    });
  }

  // clean up symbol names for object definitions
  if (objects.length === 1) {
    symbols.forEach((symbol, idx) => {
      const lowName = symbol.displayName.toLowerCase();
      if (lowName.includes(objects[0]) && lowName.includes(':')) {
        // update name
        symbol.displayName = symbol.displayName.substr(symbol.displayName.indexOf(':'));
      }
    });
  }

  // return our symbols
  return symbols;
}
