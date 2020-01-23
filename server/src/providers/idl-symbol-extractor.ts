import { Location, Position, SymbolInformation } from 'vscode-languageserver';
import { extractFunctions } from '../parsing/extract-functions';
import { extractProcedures } from '../parsing/extract-procedures';
import { extractVariables } from '../parsing/extract-variables';
import { IDL } from './idl';
import { IDLDocumentSymbol, ISelectedWord } from './idl-symbol-extractor.interface';

export class IDLSymbolExtractor {
  idl: IDL;
  constructor(idl: IDL) {
    this.idl = idl;
  }

  // tslint:disable-next-line: cyclomatic-complexity
  getSelectedWord(
    inLline: string,
    position: Position,
    constants: IDLDocumentSymbol[]
  ): ISelectedWord {
    // copy our input and buffer with a space to the left, need that for some reason...
    const line = ' ' + inLline;
    position.character += 1;

    // placeholder for the name
    let symbolName = '';
    let functionFlag = false;

    // check for an qual sign
    let equalBefore = false;
    const equalPos = line.indexOf('=');
    if (equalPos !== -1) {
      equalBefore = equalPos < position.character;
    }

    // regex for valid character to be before
    // const wordRegEx = /[a-z_][\.a-z0-9:_$\-\>]*/gim;
    const wordRegEx = /[\.a-z0-9:_$\-\>!][\.a-z0-9:_$\-\>]*/gim;

    // get the character position - move to the left so that we are in a word
    // otherwise we are outside a word as we are on the next character
    // which is usuallya  space
    let useChar = position.character;
    if (useChar > 0 && !wordRegEx.test(line.substr(useChar - 1, 1))) {
      // check if we can get a character before our cursor or not
      useChar = useChar - 1;
      switch (true) {
        case useChar === 0:
          const name = line.substr(0, 1).trim();
          if (name === '') {
            return {
              name: name,
              searchName: name,
              objName: '',
              methodName: '',
              isMethod: false,
              isFunction: false,
              equalBefore: equalBefore
            };
          }
        // character before is not a word, space or something we cant split up
        // so move back to where our cursor is
        // tslint:disable-next-line: no-switch-case-fall-through
        case !wordRegEx.test(line.substr(useChar, 1)):
          useChar += 1;
          break;
        default: // do nothing
      }
    }

    // split by words to extract our symbol that we may have clicked on
    // TODO: add logic for objects and methods here, func/pro are good for now
    let m: RegExpExecArray;
    let previous = 0;
    while ((m = wordRegEx.exec(line)) !== null) {
      // This is necessary to avoid infinite loops with zero-width matches
      if (m.index === wordRegEx.lastIndex) {
        wordRegEx.lastIndex++;
      }

      // process each match
      for (let i = 0; i < m.length; i++) {
        // get our match
        const idx = line.indexOf(m[i], previous);

        // sanity check that we found the match in our string
        if (idx !== -1) {
          // scoot the search start, in case we have more than one
          previous = idx;

          // check if our expression contains our charater
          if (idx <= useChar && idx + m[i].length >= useChar) {
            symbolName = m[i];
            functionFlag = line.substr(idx + m[i].length, 1) === '(';
            break;
          }
        }
      }
      if (symbolName !== '') {
        break;
      }
    }

    // check if we need to clean up the name
    let split: string[];
    let isMethod = false;
    let searchName: string, objName: string, methodName: string;
    switch (true) {
      case symbolName.includes('.'):
        // get to the end
        let idxDot = symbolName.indexOf('.');
        let idxPrev = idxDot;
        while (idxDot !== -1) {
          idxPrev = idxDot;
          idxDot = symbolName.indexOf('.', idxDot + 1);
        }
        split = [symbolName.substr(0, idxPrev), symbolName.substr(idxPrev + 1)];
        searchName = '::' + split[1];
        objName = split[0];
        methodName = split[1];
        isMethod = true;
        break;
      case symbolName.includes('->'):
        split = symbolName.split('->');
        searchName = '::' + split[1];
        objName = split[0];
        methodName = split[1];
        isMethod = true;
        break;
      default:
        // do nothing
        searchName = symbolName;
        objName = '';
        methodName = '';
        break;
    }

    // filter to find potential constants that we came from
    if (isMethod) {
      const above = constants
        .filter(constant => constant.range.start.line < position.line)
        .reverse();
      const constantRegEx = /[a-z_][a-z_$0-9:]*(?=\()/gim;

      // check from closet to highest symbol for match to our object name
      if (above.length > 0) {
        for (let idx = 0; idx < above.length; idx++) {
          // get the thing we might belong to
          const element = above[idx];
          // do we have a match?
          if (objName.toLowerCase() === element.name.toLowerCase()) {
            // do we have information about what is next
            if (element.next) {
              // check for function call
              if ((m = constantRegEx.exec(element.next)) !== null) {
                // does it match the start of the line?
                if (element.next.indexOf(m[0]) === 0) {
                  searchName = m[0] + searchName;
                }
              }
            }

            // exit loop as we should only check the closest item if we have a match
            break;
          }
        }
      }
    }

    return {
      name: symbolName,
      searchName: searchName,
      objName: objName,
      methodName: methodName,
      isMethod: isMethod,
      isFunction: functionFlag,
      equalBefore: equalBefore
    };
  }

  symbolizeAsDocumentSymbols(text: string): IDLDocumentSymbol[] {
    // init array of symbols
    let symbols: IDLDocumentSymbol[] = [];
    const objects: string[] = [];

    // get procedures
    symbols = symbols.concat(extractProcedures(text, objects));

    // must be after procedures because we need object definitions first, which are procedures
    symbols = symbols.concat(extractFunctions(text, objects));

    // get variable definitions
    symbols = symbols.concat(extractVariables(text));

    // return our symbols
    return symbols;
  }

  symbolizeAsSymbolInformation(text: string, uri: string): SymbolInformation[] {
    // init symbols
    const outSymbols: SymbolInformation[] = [];

    // process our document symbols
    this.symbolizeAsDocumentSymbols(text).forEach(symbol => {
      // create the location information
      outSymbols.push({
        name: symbol.name,
        kind: symbol.kind,
        location: Location.create(uri, symbol.range),
        containerName: ''
      });
    });

    return outSymbols;
  }
}
