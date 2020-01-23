import * as path from 'path';
import { runTests } from 'vscode-test';

// load in our environment
require('./../../env.testing.js');

// this routine is called when we execute "npm run test" from a command prompt
// it starts a fresh session of vscode and runs our tests
// another session of vscode cannot be up and running
async function main() {
  try {
    // The folder containing the Extension Manifest package.json
    // Passed to `--extensionDevelopmentPath`
    const extensionDevelopmentPath = path.resolve(__dirname, '../../../');

    // The path to the extension test script
    // Passed to --extensionTestsPath
    const extensionTestsPath = extensionDevelopmentPath + '/client/dist/test/index';

    // Download VS Code, unzip it and run the integration test
    await runTests({
      version: '1.41.0',
      extensionDevelopmentPath,
      extensionTestsPath
    });
    return;
  } catch (err) {
    throw err;
  }
}

main()
  .then(res => {
    process.exit(0);
  })
  .catch(err => {
    process.exit(1);
  });
