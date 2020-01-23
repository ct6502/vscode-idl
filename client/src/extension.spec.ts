import * as path from 'path';
import * as vscode from 'vscode';
import { Vulcan } from './test/vulcan/vulcan.class';
import { VulcanRunner } from './test/vulcan/vulcan.interface';

export let doc: vscode.TextDocument;
export let editor: vscode.TextEditor;
export let documentEol: string;
export let platformEol: string;

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const getDocPath = (p: string) => path.resolve(__dirname, '../../testFixture', p);
export const getDocUri = (p: string) => vscode.Uri.file(getDocPath(p));

export async function setTestContent(content: string): Promise<boolean> {
  const all = new vscode.Range(doc.positionAt(0), doc.positionAt(doc.getText().length));
  return editor.edit(eb => {
    eb.replace(all, content);
  });
}

/**
 * Activates the vscode.lsp-sample extension
 */
export async function activate(docUri: vscode.Uri) {
  // The extensionId is `publisher.name` from package.json
  const ext = vscode.extensions.getExtension('ct6502.idl');
  await ext.activate();
  try {
    doc = await vscode.workspace.openTextDocument(docUri);
    editor = await vscode.window.showTextDocument(doc);
    await sleep(2000); // Wait for server activation
    return true;
  } catch (e) {
    throw new Error(e);
  }
}

export const run: VulcanRunner = async v => {
  // alert the user
  vscode.window.showInformationMessage('Starting all tests.');

  await v.suite('Verify that we can start the client and language server', async () => {
    await v.test({ title: 'Verify the activation', timeout: 10000 }, async t => {
      const ext = vscode.extensions.getExtension('ct6502.idl');
      await ext.activate();
      t.pass();
    });
  });

  // validte that we can continue
  if (!v.passed) {
    throw new Error('Could not activate IDL extension or first test failed, cannot coninue');
  }
};
