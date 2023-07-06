import * as vscode from 'vscode';
import { ExtensionContext } from 'vscode';

// function to activate our extension
export async function activate(ctx: ExtensionContext) {
  const idlName = 'idl.idl-for-vscode';

  // alert user
  vscode.window.showInformationMessage(
    'This extension has migrated to a new place! Automatically installing the new extension. You should uninstall this deprecated extension.'
  );

  // guide the users to install Microsoft Python extension.
  const newIdl = vscode.extensions.getExtension(idlName);
  if (!newIdl) {
    // install the extension.
    await vscode.commands.executeCommand('workbench.extensions.installExtension', idlName);
  }
}

export function deactivate() {
  return undefined;
}
