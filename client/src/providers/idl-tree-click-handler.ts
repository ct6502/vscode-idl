import * as vscode from 'vscode';
import { IDL_TREE_CLICK_HANDLER_LOG } from '../core/logger.interface';
import { idlLogger, idlTranslation } from '../extension';
import { IDLAction } from './idl-tree-view';
import { COMMAND_BUTTONS } from './idl-tree-view.interface';

export class IDLTreeClickHandler {
  // get names of buttons for commands
  commandIds = COMMAND_BUTTONS.map(c => c.name);

  async clickedItem(item: IDLAction) {
    // determine what to do, ignore parent requests
    try {
      switch (true) {
        case item === undefined:
          return undefined;
          break;
        case item.contextValue === 'child':
          // alert user if needed
          idlLogger.log({
            log: IDL_TREE_CLICK_HANDLER_LOG,
            content: `Clicked on button "${item.label}"`,
            verbose: true
          });

          // determine if we are a command or not
          await vscode.commands.executeCommand(item.commandName);
          break;
        default:
        // do nothing because it is a parent
      }
    } catch (err) {
      // alert user if needed
      idlLogger.log({
        log: IDL_TREE_CLICK_HANDLER_LOG,
        level: 'error',
        content: ['Error while handling IDL tree click event', err],
        alertMessage: idlTranslation.idl.tree.clickHandlerError,
        alert: true
      });
    }

    return undefined;
  }
}
