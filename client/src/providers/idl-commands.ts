import * as vscode from 'vscode';
import { IDLTreeClickHandler } from './idl-tree-click-handler';

export class IDLCommands {
  handler: IDLTreeClickHandler;
  constructor(clickHandler: IDLTreeClickHandler) {
    this.handler = clickHandler;
  }

  registerCommands(ctx: vscode.ExtensionContext) {
    ctx.subscriptions.push(
      vscode.commands.registerCommand('idl.openIDL', () => {
        this.handler.sendIDLACommand({ label: 'Open' });
      })
    );

    ctx.subscriptions.push(
      vscode.commands.registerCommand('idl.compileFile', () => {
        this.handler.sendIDLACommand({ label: 'Compile' });
      })
    );

    ctx.subscriptions.push(
      vscode.commands.registerCommand('idl.runFile', () => {
        this.handler.sendIDLACommand({ label: 'Run' });
      })
    );

    ctx.subscriptions.push(
      vscode.commands.registerCommand('idl.stopExecution', () => {
        this.handler.sendIDLACommand({ label: 'Stop' });
      })
    );

    ctx.subscriptions.push(
      vscode.commands.registerCommand('idl.continueExecution', () => {
        this.handler.sendIDLACommand({ label: 'Continue' });
      })
    );

    ctx.subscriptions.push(
      vscode.commands.registerCommand('idl.stepIn', () => {
        this.handler.sendIDLACommand({ label: 'Step In' });
      })
    );

    ctx.subscriptions.push(
      vscode.commands.registerCommand('idl.stepOver', () => {
        this.handler.sendIDLACommand({ label: 'Step Over' });
      })
    );

    ctx.subscriptions.push(
      vscode.commands.registerCommand('idl.stepOut', () => {
        this.handler.sendIDLACommand({ label: 'Step Out' });
      })
    );

    ctx.subscriptions.push(
      vscode.commands.registerCommand('idl.resetIDL', () => {
        this.handler.sendIDLACommand({ label: 'Reset' });
      })
    );
  }
}
