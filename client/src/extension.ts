import * as vscode from 'vscode';
import { ExtensionContext } from 'vscode';

// function to activate our extension
export async function activate(ctx: ExtensionContext) {

  await vscode.commands.executeCommand('workbench.extensions.installExtension', 'idl.idl'); // install the extension.

}

export function deactivate() {
  return undefined;
}