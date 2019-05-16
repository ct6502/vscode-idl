"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const fs = require("fs");
const os = require("os");
const cp = require("child_process");
const idl_tree_view_1 = require("./idl-tree-view");
// store the IDL directory locatioons to check when auto-starting IDL
const idlDirs = {
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
class IDLTreeClickHandler {
    constructor() {
        // get names of buttons for commands
        this.commandIds = idl_tree_view_1.commandChildren.map(c => c.name);
    }
    _getIDLTerminal() {
        return vscode.window.terminals.filter(terminal => terminal.name.toLowerCase() === "idl");
    }
    _getActivePROCode() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return null;
        }
        else {
            if (editor.document.uri.fsPath.endsWith(".pro")) {
                return editor.document;
            }
            else {
                return null;
            }
        }
    }
    sendIDLACommand(item) {
        return __awaiter(this, void 0, void 0, function* () {
            // get an IDL terminal, use the first
            const terminals = this._getIDLTerminal();
            // first, check if we are opening a terminal window or not
            if (item.label === "Open") {
                if (terminals.length > 0) {
                    // make the IDL terminal appear
                    terminals[0].show();
                    vscode.window.showInformationMessage(`IDL has already been started from a terminal window.`);
                    return;
                }
                else {
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
                    }
                    else {
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
                        }
                        else {
                            vscode.window.showWarningMessage("IDL not found on PATH or in standard installation locations");
                        }
                    }
                }
            }
            else {
                // make sure we have IDL open
                if (terminals.length === 0) {
                    vscode.window.showInformationMessage(`IDL has not been started from a terminal window.`);
                }
                else {
                    // get our IDL terminal and show
                    const idl = terminals[0];
                    idl.show();
                    // determine what command we need to run
                    const code = this._getActivePROCode();
                    if (code) {
                        switch (item.label) {
                            case "Compile":
                                yield code.save();
                                idl.sendText(".compile -v '" + code.uri.fsPath + "'");
                                break;
                            case "Run":
                                yield code.save();
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
                    }
                    else {
                        vscode.window.showInformationMessage("No active PRO file in VSCode");
                    }
                }
            }
        });
    }
    clickedItem(item) {
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
}
exports.IDLTreeClickHandler = IDLTreeClickHandler;
//# sourceMappingURL=idl-tree-click-handler.js.map