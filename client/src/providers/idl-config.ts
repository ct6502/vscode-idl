import * as vscode from 'vscode';
import { idlTranslation, idlWorkspaceConfiguration } from '../extension';
import { IDLConfiguration } from '../extension.interface';
import { findIDL } from '../utils/find-idl';

export function validateConfig(idlConfiguration: IDLConfiguration) {
  // check for IDL directory
  if (idlConfiguration.idlDir === '') {
    // check the usual locations
    const idlDir = findIDL();
    if (idlDir !== undefined) {
      // prompt user for the IDL directory
      idlWorkspaceConfiguration.update('idlDir', idlDir, true);
    } else {
      if (!idlConfiguration.dontAskForIdlDir) {
        const messages: vscode.MessageItem[] = [
          { title: idlTranslation.configuration.idlDir.configure },
          { title: idlTranslation.configuration.idlDir.dontAsk }
        ];
        vscode.window
          .showInformationMessage(idlTranslation.configuration.idlDir.notFound, ...messages)
          .then(res => {
            // handle the result
            switch (true) {
              // do nothing
              case res === undefined:
                break;
              case res.title === idlTranslation.configuration.idlDir.dontAsk:
                idlWorkspaceConfiguration.update('dontAskForIdlDir', true, true);
                break;
              case res.title === idlTranslation.configuration.idlDir.configure:
                vscode.commands.executeCommand('idl.specifyIDLDirectory');
                break;
              // do nothing
              default:
            }
          });
      }
    }
  }
}
