import { readFileSync } from 'fs'; // read text file from disk
import { URI } from 'vscode-uri';
import { IDL } from './idl';

export class IDLFileHelper {
  idl: IDL;
  strings: { [key: string]: string } = {}; // save strings for all files
  regexString: { [key: string]: string } = {}; // array of strings without comments, for faster regex but still same positions
  regexStrings: { [key: string]: string[] } = {}; // array of strings without comments, for faster regex but still same positions
  cleanStrings: { [key: string]: string[] } = {}; // array of strings without comments and empty lines

  constructor(idl: IDL) {
    this.idl = idl;
  }

  _trimLine(toTrim: string) {
    let flag = true;
    let pos = 0;
    let idxComment: number, idxSingle: number, idxDouble: number;
    let next: number, min: number;

    // recurse
    while (flag) {
      // check for comment, single, and double quote
      idxComment = toTrim.indexOf(';', pos);
      idxSingle = toTrim.indexOf("'", pos);
      idxDouble = toTrim.indexOf('"', pos);
      min = Math.min(
        idxComment === -1 ? toTrim.length : idxComment,
        idxSingle === -1 ? toTrim.length : idxSingle,
        idxDouble === -1 ? toTrim.length : idxDouble
      );
      switch (true) {
        // none of the above, skip
        case min === toTrim.length:
          pos = toTrim.length;
          flag = false;
          break;

        // comment is first
        case idxComment === min:
          pos = idxComment;
          flag = false;
          break;

        // single quote first
        case idxSingle === min:
          // find close
          next = toTrim.indexOf("'", min + 1);
          if (next === -1) {
            pos = toTrim.length;
            flag = false;
          } else {
            pos = next + 1;
          }
          break;

        // double quuote first
        case idxDouble === min:
          // find close
          next = toTrim.indexOf('"', min + 1);
          if (next === -1) {
            pos = toTrim.length;
            flag = false;
          } else {
            pos = next + 1;
          }
          break;
        default: // do nothing
      }
    }

    // check if we need to trim a comment
    return pos !== toTrim.length ? toTrim.substr(0, pos).trimRight() : toTrim.trimRight();
  }

  remove(uri: string) {
    delete this.strings[uri];
    delete this.regexString[uri];
    delete this.regexStrings[uri];
    delete this.cleanStrings[uri];
  }

  // public get single line string, faster fror regex
  getFileString(uri: string, updating = false): string {
    // check if we are updating or not
    const ok = uri in this.regexString;
    if (!ok || updating) {
      const strings = this._getStrings(uri);
      this._cleanStrings(uri, strings);
    }
    return this.regexString[uri];
  }

  // public get array of strings for file, used for searching
  getFileStrings(uri: string, updating = false): string[] {
    // check if we are updating or not
    const ok = uri in this.regexString;
    if (!ok || updating) {
      const strings = this._getStrings(uri);
      this._cleanStrings(uri, strings);
    }
    return this.regexStrings[uri];
  }

  // get strings for our document, it will be a single string
  _getStrings(uri: string): string {
    // init return value
    let strings = '';

    // get the document we are processing
    const doc = this.idl.documents.get(uri);
    if (doc !== undefined) {
      strings = doc.getText();
    } else {
      const parsed = URI.parse(uri);
      strings = readFileSync(parsed.fsPath, 'utf8');
    }

    // save lookup information
    this.strings[uri] = strings;

    return strings;
  }

  // single line string to be split, remove exmpty lines, and remove comments
  private _cleanStrings(uri: string, toClean: string) {
    // make string array
    const strings: string[] = [];
    const noComments: string[] = [];

    // filter
    const split = toClean.split('\n');
    for (let idx = 0; idx < split.length; idx++) {
      // remove all formatting and comments
      const line = this._trimLine(split[idx].trimRight());

      // save in no comments
      noComments.push(line);

      // remove if empty
      if (!line) {
        continue;
      }

      // save if we get here
      strings.push(line);
    }

    // save processed strings
    this.regexStrings[uri] = noComments;
    this.regexString[uri] = noComments.join('\n');
    this.cleanStrings[uri] = strings;
  }
}
