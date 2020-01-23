import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { IDL_DIRS } from '../core/idl.interface';

export function findIDL(): string | undefined {
  // detect IDL's installation directory
  let idlDir: string;

  // check the environment variable
  if (idlDir === undefined) {
    if ('IDL_DIR' in process.env) {
      // get the variable
      idlDir = process.env.IDL_DIR;

      // check if we have anything to add to the path
      let add = '';
      switch (os.platform()) {
        case 'linux':
          add = 'bin';
          break;
        case 'darwin':
          add = 'bin';
          break;
        default:
          // do nothing
          add = '';
      }

      // append the bin folder - just default to 64 bit for now
      if (add) {
        idlDir += `${path.sep}${add}`;
      }
    }
  } else {
    const testDirs = IDL_DIRS[os.platform()];
    for (let i = 0; i < testDirs.length; i++) {
      const dir = testDirs[i];
      if (fs.existsSync(dir)) {
        idlDir = dir;
        break;
      }
    }
  }

  return idlDir;
}
