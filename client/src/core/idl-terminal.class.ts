import * as vscode from 'vscode';
import { IDLCommandAction } from '../core/idl-command-action.interface';
import { idlTranslation } from '../extension';
import { IDLAction } from '../providers/idl-tree-view';
import { cleanPath } from '../utils/clean-path';
import { getActivePROCode, getIDLTerminal, startIDLTerminal } from './idl.helpers';

export class IDLTerminal {
  async sendIDLACommand(item: IDLAction | IDLCommandAction) {
    // get an IDL terminal, use the first
    const terminals = getIDLTerminal();

    // validate that IDL is open already, or try depending on the action
    switch (true) {
      // try to start IDL if it isnt open and return
      case item.label === 'Open' && terminals.length === 0:
        return startIDLTerminal();

      // check if we are already open
      case item.label === 'Open' && terminals.length > 0:
        terminals[0].show();
        vscode.window.showInformationMessage(idlTranslation.debugger.idl.alreadyStartedTerminal);
        return true;

      // no terminals, so alert user and return
      case terminals.length === 0:
        vscode.window.showInformationMessage(idlTranslation.debugger.idl.pleaseStartTerminal);
        return false;

      // bring IDL to the front
      default:
        terminals[0].show();
        break;
    }

    // get our IDL terminal
    const idl = terminals[0];

    // determine what command we need to run
    let code: vscode.TextDocument;

    // check what our action is
    switch (item.label) {
      case 'Compile':
        code = getActivePROCode(true);
        if (!code) {
          return false;
        }
        await code.save();
        idl.sendText(`.compile -v '${cleanPath(code.uri.fsPath)}'`);
        break;
      case 'Run':
        code = getActivePROCode(true);
        if (!code) {
          return false;
        }
        await code.save();
        idl.sendText(`.compile -v '${cleanPath(code.uri.fsPath)}'`);
        idl.sendText('.go');
        break;
      case 'Execute':
        code = getActivePROCode(true);
        if (!code) {
          return false;
        }
        await code.save();
        idl.sendText(`@${cleanPath(code.uri.fsPath)}`);
        break;
      case 'Stop':
        idl.sendText('\u0003', false);
        break;
      case 'Continue':
        idl.sendText('.continue');
        break;
      case 'Step In':
        idl.sendText('.step');
        break;
      case 'Step Over':
        idl.sendText('.stepover');
        break;
      case 'Step Out':
        idl.sendText('.out');
        break;
      case 'Reset':
        idl.sendText('.reset');
        break;
      default:
      // do nothing
    }
    return true;
  }
}
