"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const path = require("path");
// get all directories for icons
const thisDir = path.dirname(__filename);
const srcDir = path.dirname(thisDir);
const clientDir = path.dirname(srcDir);
const extensionDir = path.dirname(clientDir);
// specify the children for the command parent in the tree view
exports.commandChildren = [
    {
        name: "Open",
        descripion: "a new IDL terminal window",
        icon: "open-new.svg"
    },
    {
        name: "Compile",
        descripion: "the active PRO file",
        icon: "settings.svg"
    },
    {
        name: "Run",
        descripion: "the active PRO file",
        icon: "play.svg"
    },
    {
        name: "Stop",
        descripion: "the IDL interpreter",
        icon: "stop.svg"
    },
    {
        name: "Continue",
        descripion: "running the IDL interpreter",
        icon: "play.svg"
    },
    {
        name: "In",
        descripion: "When debugging, step into a routine call",
        icon: "arrow-down.svg"
    },
    {
        name: "Over",
        descripion: "When debugging, step over a routine call",
        icon: "arrow-over.svg"
    },
    {
        name: "Out",
        descripion: "When debugging, step out of a routine",
        icon: "arrow-up.svg"
    },
    {
        name: "Reset",
        descripion: "the IDL session",
        icon: "renew.svg"
    }
];
class IDLTreeViewProvider {
    constructor(workspaceRoot) {
        this.workspaceRoot = workspaceRoot;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this
            ._onDidChangeTreeData.event;
        // build our tree
        this.tree = {
            Commands: exports.commandChildren.map(child => new IDLAction(child.name, child.descripion, vscode.TreeItemCollapsibleState.None, child.icon))
        };
        this.parents = {
            Commands: new IDLAction("Commands", "", vscode.TreeItemCollapsibleState.Expanded, "assessment.svg")
        };
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        return element;
    }
    getParent(element) {
        if (this.tree[element.label]) {
            return null;
        }
        else {
            const parents = Object.keys(this.tree);
            for (let i = 0; i < parents.length; i++) {
                const idx = this.tree[parents[i]]
                    .map(c => c.label)
                    .indexOf(element.label);
                if (idx !== -1) {
                    return this.parents[parents[i]];
                }
            }
            return null;
        }
    }
    getChildren(element) {
        // return all of our parent elements
        if (!element) {
            const keys = Object.keys(this.parents);
            return Promise.resolve(keys.map(key => this.parents[key]));
        }
        else {
            // check if we have parent information
            if (this.tree[element.label]) {
                return Promise.resolve(this.tree[element.label]);
            }
            else {
                return Promise.resolve([]);
            }
        }
    }
}
exports.IDLTreeViewProvider = IDLTreeViewProvider;
class IDLAction extends vscode.TreeItem {
    constructor(label, version, collapsibleState, iconName) {
        super(label, collapsibleState);
        this.label = label;
        this.version = version;
        this.collapsibleState = collapsibleState;
        this.iconName = iconName;
        this.contextValue = "IDLAction";
        // check if we are a parent or child
        if (collapsibleState === vscode.TreeItemCollapsibleState.Expanded) {
            this.contextValue = "parent";
        }
        else {
            this.contextValue = "child";
        }
        this.iconPath = {
            light: path.join(extensionDir, "images", "light", iconName),
            dark: path.join(extensionDir, "images", "dark", iconName)
        };
    }
    get tooltip() {
        return this.label + " " + this.version;
    }
    get description() {
        return this.version;
    }
}
exports.IDLAction = IDLAction;
//# sourceMappingURL=idl-tree-view.js.map