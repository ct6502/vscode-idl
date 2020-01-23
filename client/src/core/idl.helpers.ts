import { platform } from 'os';
import * as vscode from 'vscode';
import { idlConfiguration, idlTranslation } from '../extension';

export function getActivePROCode(alert = true): vscode.TextDocument | undefined {
  const editor = vscode.window.activeTextEditor;
  switch (true) {
    case !editor:
      if (alert) {
        vscode.window.showInformationMessage(idlTranslation.debugger.idl.noPROFile);
      }
      return undefined;
    case editor.document.uri.fsPath.endsWith('.pro'):
      return editor.document;
    default:
      if (alert) {
        vscode.window.showInformationMessage(idlTranslation.debugger.idl.noPROFile);
      }
      return undefined;
  }
}

export function getIDLTerminal(): vscode.Terminal[] {
  return vscode.window.terminals.filter(terminal => terminal.name.toLowerCase() === 'idl');
}

export function startIDLTerminal(): boolean {
  let newTerminal: vscode.Terminal;

  // make sure we have a folder
  if (!idlConfiguration.idlDir) {
    vscode.window
      .showInformationMessage(idlTranslation.debugger.idl.noIDLDirFound, {
        title: idlTranslation.configuration.idlDir.configure
      })
      .then(res => {
        if (res !== undefined) {
          if (res.title === idlTranslation.configuration.idlDir.configure) {
            vscode.commands.executeCommand('idl.specifyIDLDirectory');
          }
        }
      });
    return false;
  }

  // get the environment - strip vscode environment variables
  // we use them in IDL to check for debug console
  const useEnv = { ...process.env };
  Object.keys(useEnv).forEach(key => {
    if (key.startsWith('VSCODE_')) {
      delete useEnv[key];
    }
  });

  // make sure we found the directory
  newTerminal = vscode.window.createTerminal({
    shellPath: platform() === 'win32' ? 'cmd.exe' : null,
    env: useEnv
  });
  newTerminal.sendText('cd ' + idlConfiguration.idlDir + ' && idl');
  newTerminal.show();

  return true;
}
