import * as vscode from "vscode";
import * as path from "path";

// get all directories for icons
const thisDir = path.dirname(__filename);
const srcDir = path.dirname(thisDir);
const clientDir = path.dirname(srcDir);
const extensionDir = path.dirname(clientDir);

// constants to store the names and information for child objects
interface IChild {
  name: string;
  descripion: string;
  icon: string;
}

// specify the children for the command parent in the tree view
const commandChildren: IChild[] = [
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

export class IDLTreeViewProvider implements vscode.TreeDataProvider<IDLAction> {
  private _onDidChangeTreeData: vscode.EventEmitter<
    IDLAction | undefined
  > = new vscode.EventEmitter<IDLAction | undefined>();
  readonly onDidChangeTreeData: vscode.Event<IDLAction | undefined> = this
    ._onDidChangeTreeData.event;

  constructor(private workspaceRoot: string) {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: IDLAction): vscode.TreeItem {
    return element;
  }

  getChildren(element?: IDLAction): Thenable<IDLAction[]> {
    // return all of our parent elements
    if (!element) {
      return Promise.resolve([
        new IDLAction(
          "Commands",
          "",
          vscode.TreeItemCollapsibleState.Expanded,
          "assessment.svg"
        )
      ]);
    } else {
      // determine who our parent is so that we can dynamically build our tree
      switch (true) {
        case element.label === "Commands":
          return Promise.resolve(
            commandChildren.map(
              child =>
                new IDLAction(
                  child.name,
                  child.descripion,
                  vscode.TreeItemCollapsibleState.None,
                  child.icon
                )
            )
          );
          break;
        default:
          // no children
          return Promise.resolve([]);
      }
    }
  }
}

export class IDLAction extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    private version: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    private iconName: string
  ) {
    super(label, collapsibleState);

    // check if we are a parent or child
    if (collapsibleState === vscode.TreeItemCollapsibleState.Expanded) {
      this.contextValue = "parent";
    } else {
      this.contextValue = "child";
    }

    this.iconPath = {
      light: path.join(extensionDir, "images", "light", iconName),
      dark: path.join(extensionDir, "images", "dark", iconName)
    };
  }

  get tooltip(): string {
    return this.label + " " + this.version;
  }

  get description(): string {
    return this.version;
  }

  contextValue = "IDLAction";
}
