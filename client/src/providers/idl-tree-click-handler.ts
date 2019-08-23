import * as vscode from "vscode";
import * as fs from "fs";
import * as os from "os";
import * as cp from "child_process";
import { IDLAction, commandChildren } from "./idl-tree-view";

// store the IDL directory locatioons to check when auto-starting IDL
const idlDirs: { [key: string]: string[] } = {
  darwin: [
    "/Applications/harris/envi55/idl87/bin/bin.darwin.x86_64",
    "/Applications/harris/idl87/bin/bin.darwin.x86_64",
    "/Applications/harris/envi54/idl86/bin/bin.darwin.x86_64",
    "/Applications/harris/idl86/bin/bin.darwin.x86_64"
  ],
  linux: [
    "/usr/local/harris/envi55/idl87/bin/bin.linux.x86_64",
    "/usr/local/harris/idl87/bin/bin.linux.x86_64",
    "/usr/local/harris/envi54/idl86/bin/bin.linux.x86_64",
    "/usr/local/harris/idl86/bin/bin.linux.x86_64"
  ],
  win32: [
    "C:\\Program Files\\Harris\\ENVI55\\IDL87\\bin\\bin.x86_64",
    "C:\\Program Files\\Harris\\IDL87\\bin\\bin.x86_64",
    "C:\\Program Files\\Harris\\ENVI54\\IDL86\\bin\\bin.x86_64",
    "C:\\Program Files\\Harris\\IDL86\\bin\\bin.x86_64"
  ],

  // other OS values, just in case we come across them
  aix: [],
  freebsd: [],
  openbsd: [],
  sunos: []
};

export class IDLTreeClickHandler {
  // get names of buttons for commands
  commandIds = commandChildren.map(c => c.name);

  constructor() {}

  private _getIDLTerminal(): vscode.Terminal[] {
    return vscode.window.terminals.filter(
      terminal => terminal.name.toLowerCase() === "idl"
    );
  }

  private _getActivePROCode(): vscode.TextDocument | null {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return null;
    } else {
      if (editor.document.uri.fsPath.endsWith(".pro")) {
        return editor.document;
      } else {
        return null;
      }
    }
  }

  private async sendIDLACommand(item: IDLAction) {
    // get an IDL terminal, use the first
    const terminals = this._getIDLTerminal();

    // first, check if we are opening a terminal window or not
    if (item.label === "Open") {
      if (terminals.length > 0) {
        // make the IDL terminal appear
        terminals[0].show();
        vscode.window.showInformationMessage(
          `IDL has already been started from a terminal window.`
        );
        return;
      } else {
        // detect IDL's installation directory
        let idlDir = "";
        const testDirs = idlDirs[os.platform()];
        for (let i = 0; i < testDirs.length; i++) {
          const dir = testDirs[i];
          if (fs.existsSync(dir)) {
            idlDir = dir;
            break;
          }
        }

        // make sure we found the directory
        if (idlDir !== "") {
          // make a new terminal
          const newTerminal = vscode.window.createTerminal();
          newTerminal.sendText("cd " + idlDir + " && idl");
          newTerminal.show();
          this.registerTerminalForCapture(newTerminal);

          // newTerminal.sendText = (
          //   text: string,
          //   addNewLine: boolean = true
          // ): void => {
          //   (<any>newTerminal)._checkDisposed();
          //   console.log([text]);
          //   // (<any>newTerminal)._queueApiRequest((<any>newTerminal)._proxy.$sendText, [text, addNewLine]);
          // };
          // const renderer = (<any>vscode.window).createTerminalRenderer("idl");
          // const newTerminal = renderer.terminal;
          // renderer.terminal.sendText("cd " + idlDir + " && idl");
          // renderer.terminal.show();

          // const uri = vscode.Uri.file('');
          // vscode.workspace.openTextDocument(uri);
          // // vscode.window.showTextDocument()

          // renderer.write("\x1b[31mHello world\x1b[0m");
        } else {
          // try to spawn IDL
          const output = cp.spawnSync("idl");

          // check if IDL is on the path
          let foundIDL = false;
          output.output.forEach(res => {
            if (res !== null && !foundIDL) {
              if (res.toString().includes("IDL ")) {
                foundIDL = true;
              }
            }
          });

          // check if we have the A-ok to start IDL
          if (foundIDL) {
            // make a new terminal
            const newTerminal = vscode.window.createTerminal();
            newTerminal.sendText("idl");
            newTerminal.show();
          } else {
            vscode.window.showWarningMessage(
              "IDL not found on PATH or in standard installation locations"
            );
          }
        }
      }
    } else {
      // make sure we have IDL open
      if (terminals.length === 0) {
        vscode.window.showInformationMessage(
          `IDL has not been started from a terminal window.`
        );
      } else {
        // get our IDL terminal and show
        const idl = terminals[0];
        idl.show();

        // determine what command we need to run
        const code = this._getActivePROCode();
        if (code) {
          switch (item.label) {
            case "Compile":
              await code.save();
              idl.sendText(".compile -v '" + code.uri.fsPath + "'");
              break;
            case "Run":
              await code.save();
              idl.sendText(".compile -v '" + code.uri.fsPath + "'");
              idl.sendText(".go");
              break;
            case "Stop":
              idl.sendText("\u0003", false);
              break;
            case "Continue":
              idl.sendText(".continue");
              break;
            case "In":
              idl.sendText(".step");
              break;
            case "Over":
              idl.sendText(".stepover");
              break;
            case "Out":
              idl.sendText(".out");
              break;
            case "Reset":
              idl.sendText(".reset");
              break;
            default:
            // do nothing
          }
        } else {
          vscode.window.showInformationMessage("No active PRO file in VSCode");
        }
      }
    }
  }

  clickedItem(item: IDLAction) {
    // determine what to do, ignore parent requests
    switch (true) {
      case item.contextValue === "child":
        // determine if we are a command or not
        if (this.commandIds.indexOf(item.label) !== -1) {
          this.sendIDLACommand(item);
        }
        break;
      default:
      // do nothing
    }
  }

  terminal = {};

  registerTerminalForCapture(terminal: vscode.Terminal) {
    terminal.processId
      .then(
        terminalId => {
          // (<any>terminal).onDidWriteData((data: string) => {
          //   terminal[terminalId] += data;
          //   console.log(data.endsWith("\u000d"));
          //   // console.log(terminal[terminalId]);
          // });
          (<any>terminal).onDidWriteData((data: string) => {
            // terminal[terminalId] += data;
            // console.log(data);
            // console.log(terminal[terminalId]);
          });
        },
        rejected => {
          console.log(rejected);
        }
      )
      .then(undefined, rejected => {
        console.log(rejected);
      });
  }
}
