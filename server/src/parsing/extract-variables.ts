import { DocumentSymbol, Position, Range, SymbolKind } from 'vscode-languageserver';
import { IDLDocumentSymbol } from '../providers/idl-symbol-extractor.interface';

// grab variables, not perfect but a happy fix for losing this functionality
export function extractVariables(text: string): IDLDocumentSymbol[] {
  // init symbols
  const symbols: IDLDocumentSymbol[] = [];

  // find all procedure definitions
  // (skip if line continuation)(dont use if continue, begin, or endif is ahead)(ok for start or in if statements)()capture right side
  const proRegex = /(?<!,\s*\$.*\n^\s*)(?<=^\s*|then |else | else\s*:|:\s*)([a-z_][a-z_$0-9]*)(\s*=\s*)([a-z_][a-z_0-9$]*-\>[a-z_][a-z_0-9.$]*|[a-z_0-9][a-z_0-9.$]*)/gim;
  let m: RegExpExecArray;
  while ((m = proRegex.exec(text)) !== null) {
    // This is necessary to avoid infinite loops with zero-width matches
    if (m.index === proRegex.lastIndex) {
      proRegex.lastIndex++;
    }

    // get the line of this character
    const allSplit = text.split('\n');
    const split = text.substr(0, m.index).split('\n');
    const lineNumber = split.length - 1;
    const start = split[split.length - 1].length; // length of string start

    // track how much farther we moved
    let startAdd = 0;

    // The result can be accessed through the `m`-variable.
    m.forEach((match, groupIndex) => {
      // determine how to process
      switch (groupIndex) {
        case 0: // do nothing for full match
          break;
        case 3:
          // check the thing to our right
          let right = allSplit[lineNumber].substr(start + startAdd).trim();

          // check for obj_new calls and get the object class
          const regex = /(?<=obj_new\(\s*['"])([a-z_][a-z_0-9&]*)/gim;
          if ((m = regex.exec(right)) !== null) {
            right = m[0] + '()';
          }

          symbols[symbols.length - 1].next = right;
          break;
        // first capture group is left of the equal sign
        case 1:
          // get range
          const range = Range.create(
            Position.create(lineNumber, start),
            Position.create(lineNumber, start + match.length)
          );

          // make our symbol
          // TODO: figure out how to associate these with a routine so that
          // we could "catch" errors with redifining variable. but do we need this?
          // we dont have this in TS so maybe not
          const symbol: IDLDocumentSymbol = DocumentSymbol.create(
            match,
            'Variable',
            SymbolKind.Variable,
            range,
            range
          );

          // save the display name of our symbol, hack to get around custom IDL symbol here
          symbol.displayName = match;

          // save
          symbols.push(symbol);
        // tslint:disable-next-line: no-switch-case-fall-through
        default:
          // bump start if not full match
          startAdd += match.length;
      }
    });
  }

  // return our symbols
  return symbols;
}
