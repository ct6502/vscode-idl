import * as path from 'path';
import { runTests } from 'vscode-test';

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
      version: '1.38.0',
      extensionDevelopmentPath,
      extensionTestsPath
    });
  } catch (err) {
    console.error('Failed to run tests');
    process.exit(1);
  }
}

main();
