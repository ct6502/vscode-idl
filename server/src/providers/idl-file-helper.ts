import { IDL } from './idl';
import { readFileSync } from 'fs'; // read text file from disk
import Uri from 'vscode-uri'; // handle URI to file system and back

export class IDLFileHelper {
  idl: IDL;
  strings: { [key: string]: string } = {}; // save strings for all files
  regexString: { [key: string]: string } = {}; // array of strings without comments, for faster regex but still same positions
  regexStrings: { [key: string]: string[] } = {}; // array of strings without comments, for faster regex but still same positions
  cleanStrings: { [key: string]: string[] } = {}; // array of strings without comments and empty lines

  constructor(idl: IDL) {
    this.idl = idl;
  }

  // get strings for our document, it will be a single string
  private _getStrings(uri: string): string {
    // init return value
    let strings = '';

    // get the document we are processing
    const doc = this.idl.documents.get(uri);
    if (doc !== undefined) {
      strings = doc.getText();
    } else {
      const parsed = Uri.parse(uri);
      strings = readFileSync(parsed.fsPath, 'utf8');
    }

    // save lookup information
    this.strings[uri] = strings;

    return strings;
  }

  _trimLine(line: string) {
    let flag = true;
    let pos = 0;
    let idxComment: number, idxSingle: number, idxDouble: number;
    let next: number, min: number;

    // recurse
    while (flag) {
      // check for comment, single, and double quote
      idxComment = line.indexOf(';', pos);
      idxSingle = line.indexOf("'", pos);
      idxDouble = line.indexOf('"', pos);
      min = Math.min(
        idxComment === -1 ? line.length : idxComment,
        idxSingle === -1 ? line.length : idxSingle,
        idxDouble === -1 ? line.length : idxDouble
      );
      switch (true) {
        // none of the above, skip
        case min === line.length:
          pos = line.length;
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
          next = line.indexOf("'", min + 1);
          if (next === -1) {
            pos = line.length;
            flag = false;
          } else {
            pos = next + 1;
          }
          break;

        // double quuote first
        case idxDouble === min:
          // find close
          next = line.indexOf('"', min + 1);
          if (next === -1) {
            pos = line.length;
            flag = false;
          } else {
            pos = next + 1;
          }
          break;
      }
    }

    // check if we need to trim a comment
    if (pos !== line.length) {
      line = line.substr(0, pos);
    }

    // return our strings trimmed
    return line.trimRight();
  }

  // single line string to be split, remove exmpty lines, and remove comments
  private _cleanStrings(uri: string, string: string) {
    // make string array
    const strings: string[] = [];
    const noComments: string[] = [];

    //filter
    const split = string.split('\n');
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

  public remove(uri: string) {
    delete this.strings[uri];
    delete this.regexString[uri];
    delete this.regexStrings[uri];
    delete this.cleanStrings[uri];
  }

  // public get single line string, faster fror regex
  public getFileString(uri: string, updating = false): string {
    // check if we are updating or not
    const ok = uri in this.regexString;
    if (!ok || updating) {
      const strings = this._getStrings(uri);
      this._cleanStrings(uri, strings);
    }
    return this.regexString[uri];
  }

  // public get array of strings for file, used for searching
  public getFileStrings(uri: string, updating = false): string[] {
    // check if we are updating or not
    const ok = uri in this.regexString;
    if (!ok || updating) {
      const strings = this._getStrings(uri);
      this._cleanStrings(uri, strings);
    }
    return this.regexStrings[uri];
  }
}
