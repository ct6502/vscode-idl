import * as vscode from 'vscode';
import { ExtensionContext } from 'vscode';

// function to activate our extension
export async function activate(ctx: ExtensionContext) {
  const idlName = 'idl.idl';

  // guide the users to install Microsoft Python extension.
  const newIdl = vscode.extensions.getExtension(idlName);
  if (!newIdl) {
    vscode.window.showInformationMessage('This extension has migrated to a new place! Automatically installing the latest version, with many features and updates')
    await vscode.commands.executeCommand('workbench.extensions.installExtension', 'idl.idl'); // install the extension.
  }

}

export function deactivate() {
  return undefined;
}