import * as path from 'path';
import * as vscode from 'vscode';
import { getExtensionDir } from '../extension';
import { VulcanRunner } from '../test/vulcan/vulcan.interface';

export const run: VulcanRunner = async v => {
  // load our package.json file
  const json = require('./../../../package.json');
  const activations: string[] = json.activationEvents;
  const commands: [{ command: string; title: string }] = json.contributes.commands;

  // indicate which commands we should skip
  const skipThese = ['idl.specifyIDLDirectory', 'idl.specifyIDLDirectoryWorkspace', 'idl.fileABug'];

  // get the list of commands for testing
  const testCommands = commands.filter(cmd => skipThese.indexOf(cmd.command) === -1);

  // get the extension directory
  const extDir = getExtensionDir();

  // get a file we want to open
  const testFile = vscode.Uri.file(path.join(extDir, 'idl', 'test', 'test_things.pro'));

  await v.suite('Verify we can run most of our commands', async () => {
    // open some PRO code so that we can run our tests
    const doc = await vscode.workspace.openTextDocument(testFile);
    await vscode.window.showTextDocument(doc);

    // pause before running the commands
    await v.sleep(100);

    // process each command
    for (let i = 0; i < testCommands.length; i++) {
      // get the command name
      const cmd = testCommands[i];

      // test our command
      await v.test({ title: `Testing command "${cmd.command}"`, timeout: 10000 }, async t => {
        // check if we have any preprocessing to do
        switch (cmd.command) {
          case 'idl.openIDLTerminal':
            await vscode.window.showTextDocument(doc);
            break;
          default:
            break;
        }

        let res;
        try {
          res = await vscode.commands.executeCommand(cmd.command);
        } catch (err) {
          throw new Error(err);
        }

        // wait to start up the terminal, interesting how it takes about 2x as long
        if (cmd.command === 'idl.openIDLTerminal') {
          await v.sleep(4000);
        }
        // if (res === undefined) {
        //   console.log(JSON.stringify(res));
        // }
        t.truthy(res);
      });

      // sleep - if commands are executed too fast in the terminal
      // then we hang for some reason
      await v.sleep(100);
    }
  });
};
