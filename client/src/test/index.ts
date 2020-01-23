import * as glob from 'glob';
import * as path from 'path';
import { Vulcan } from './vulcan/vulcan.class';

// this routine is called when we execute tests from within vscode
// it discovers all of the tests files and runs them with annpoying mocha
export async function run(): Promise<number> {
  const testsRoot = path.resolve(__dirname, '..');

  return new Promise((resolve, reject) => {
    glob('**/**.spec.js', { cwd: testsRoot }, async (err, files) => {
      if (err) {
        reject(err);
        return;
      }

      // get the client folder for the extension which is where our output for
      // code coverage will go
      const cwd = path.join(__dirname, '..', '..');

      // get fully-qualified paths
      const mapped = files.map(file => path.resolve(testsRoot, file));

      // forge our code with vulcan
      const v = new Vulcan({ cwd: cwd, files: mapped });

      try {
        const passed = await v.run();
        if (!passed) {
          // tslint:disable-next-line: no-console
          console.log('------------------------------------------------------------');
          // tslint:disable-next-line: no-console
          console.log('------------------------------------------------------------');
          // tslint:disable-next-line: no-console
          console.log(`See "${process.env.VSCODE_IDL_LOGFILE}" for complete IDL debug output`);
          // tslint:disable-next-line: no-console
          console.log('------------------------------------------------------------');
          // tslint:disable-next-line: no-console
          console.log('------------------------------------------------------------');
          // tslint:disable-next-line: no-console
          console.log('');
          // tslint:disable-next-line: no-console
          console.log('');

          reject(new Error(`Failed ${v.stats.failed} test(s)`));
        }
        resolve();
      } catch (err) {
        reject(err);
      }
      return;
    });
  });
}
