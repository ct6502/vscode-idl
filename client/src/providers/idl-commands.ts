import * as vscode from 'vscode';
import { URI } from 'vscode-uri'; // handle URI to file system and back
import { IDL_COMMAND_LOG } from '../core/logger.interface';
import { idlLogger, idlTerminal, idlTranslation, idlWorkspaceConfiguration } from '../extension';
import { cleanPath } from '../utils/clean-path';

// get the command errors
const cmdErrors = idlTranslation.commands.errors;

export class IDLCommandProvider {
  registerCommands(ctx: vscode.ExtensionContext) {
    ctx.subscriptions.push(
      vscode.commands.registerCommand('idl.fileABug', async () => {
        try {
          await vscode.env.openExternal(
            vscode.Uri.parse('https://github.com/chris-torrence/vscode-idl/issues/new')
          );
        } catch (err) {
          this._handleError('Error while filing a bug', err, cmdErrors.fileABug);
        }
      })
    );

    ctx.subscriptions.push(
      vscode.commands.registerCommand('idl.specifyIDLDirectory', async () => {
        try {
          this._handleLogging('Specify IDL directory (User)');
          const res = await vscode.window.showOpenDialog({
            canSelectFiles: false,
            canSelectFolders: true,
            openLabel: 'Specify IDL Directory (User)'
          });

          // make sure we found something
          if (res === undefined) {
            return;
          }
          if (res.length === 0) {
            return;
          }

          const parsed = URI.parse(res[0].path);
          idlWorkspaceConfiguration.update('idlDir', cleanPath(parsed.fsPath), true);
        } catch (err) {
          this._handleError(
            'Error while setting IDL directory (User)',
            err,
            cmdErrors.specifyIDLDirectory
          );
        }
      })
    );

    ctx.subscriptions.push(
      vscode.commands.registerCommand('idl.specifyIDLDirectoryWorkspace', async () => {
        try {
          this._handleLogging('Specify IDL directory (Workspace)');
          const res = await vscode.window.showOpenDialog({
            canSelectFiles: false,
            canSelectFolders: true,
            openLabel: 'Specify IDL Directory (Workspace)'
          });

          // make sure we found something
          if (res === undefined) {
            return;
          }
          if (res.length === 0) {
            return;
          }

          const parsed = URI.parse(res[0].path);
          idlWorkspaceConfiguration.update('idlDir', cleanPath(parsed.fsPath), false);
        } catch (err) {
          this._handleError(
            'Error while setting IDL directory (Workspace)',
            err,
            cmdErrors.specifyIDLDirectoryWorkspace
          );
        }
      })
    );

    ctx.subscriptions.push(
      vscode.commands.registerCommand('idl.openIDLTerminal', async () => {
        try {
          this._handleLogging('Opening IDL terminal');
          await idlTerminal.sendIDLACommand({ label: 'Open' });
          return true;
        } catch (err) {
          this._handleError('Error while opening IDL terminal', err, cmdErrors.openIDLTerminal);
          return false;
        }
      })
    );

    ctx.subscriptions.push(
      vscode.commands.registerCommand('idl.compileFileTerminal', async () => {
        try {
          this._handleLogging('Compiling file in IDL terminal');
          return await idlTerminal.sendIDLACommand({ label: 'Compile' });
        } catch (err) {
          this._handleError(
            'Error while compiling file in IDL terminal',
            err,
            cmdErrors.compileFileTerminal
          );
          return false;
        }
      })
    );

    ctx.subscriptions.push(
      vscode.commands.registerCommand('idl.runFileTerminal', async () => {
        try {
          this._handleLogging('Running file in terminal');
          return await idlTerminal.sendIDLACommand({ label: 'Run' });
        } catch (err) {
          this._handleError(
            'Error while running file in IDL temrinal',
            err,
            cmdErrors.runFileTerminal
          );
          return false;
        }
      })
    );

    ctx.subscriptions.push(
      vscode.commands.registerCommand('idl.executeBatchFileTerminal', async () => {
        try {
          this._handleLogging('Execute batch file in IDL terminal');
          return await idlTerminal.sendIDLACommand({ label: 'Execute' });
        } catch (err) {
          this._handleError(
            'Error while executing batch file in IDL temrinal',
            err,
            cmdErrors.executeBatchFileTerminal
          );
          return false;
        }
      })
    );

    ctx.subscriptions.push(
      vscode.commands.registerCommand('idl.resetIDLTerminal', async () => {
        try {
          this._handleLogging('Reset IDL');
          await idlTerminal.sendIDLACommand({ label: 'Reset' });
          return true;
        } catch (err) {
          this._handleError('Error while resetting IDL', err, cmdErrors.resetIDLTerminal);
          return false;
        }
      })
    );

    ctx.subscriptions.push(
      vscode.commands.registerCommand('idl.stopExecutionTerminal', async () => {
        try {
          this._handleLogging('Stopping execution in IDL terminal');
          await idlTerminal.sendIDLACommand({ label: 'Stop' });
          return true;
        } catch (err) {
          this._handleError('Error while stopping IDL', err, cmdErrors.stopExecutionTerminal);
          return false;
        }
      })
    );

    ctx.subscriptions.push(
      vscode.commands.registerCommand('idl.continueExecutionTerminal', async () => {
        try {
          this._handleLogging('Continue execution in IDL terminal');
          await idlTerminal.sendIDLACommand({ label: 'Continue' });
          return true;
        } catch (err) {
          this._handleError(
            'Error while continuing execution in IDL temrinal',
            err,
            cmdErrors.continueExecutionTerminal
          );
          return false;
        }
      })
    );

    ctx.subscriptions.push(
      vscode.commands.registerCommand('idl.stepInTerminal', async () => {
        try {
          this._handleLogging('Step in IDL temrinal');
          await idlTerminal.sendIDLACommand({ label: 'Step In' });
          return true;
        } catch (err) {
          this._handleError('Error while steping in IDL terminal', err, cmdErrors.stepInTerminal);
          return false;
        }
      })
    );

    ctx.subscriptions.push(
      vscode.commands.registerCommand('idl.stepOverTerminal', async () => {
        try {
          this._handleLogging('Step over IDL terminal');
          await idlTerminal.sendIDLACommand({ label: 'Step Over' });
          return true;
        } catch (err) {
          this._handleError(
            'Error while stepping over in IDL terminal',
            err,
            cmdErrors.stepOverTerminal
          );
          return false;
        }
      })
    );

    ctx.subscriptions.push(
      vscode.commands.registerCommand('idl.stepOutTerminal', async () => {
        try {
          this._handleLogging('Step out IDL terminal');
          await idlTerminal.sendIDLACommand({ label: 'Step Out' });
          return true;
        } catch (err) {
          this._handleError(
            'Error while stepping out of IDL terminal',
            err,
            cmdErrors.stepOutTerminal
          );
          return false;
        }
      })
    );
  }

  // tslint:disable-next-line: prefer-function-over-method
  private _handleLogging(msg: string) {
    idlLogger.log({
      log: IDL_COMMAND_LOG,
      content: msg,
      level: 'info'
    });
  }

  // tslint:disable-next-line: prefer-function-over-method
  private _handleError(msg: string, err: any, alertMsg: string) {
    idlLogger.log({
      log: IDL_COMMAND_LOG,
      content: [msg, err],
      level: 'error',
      alert: true,
      alertMessage: alertMsg
    });
  }
}
