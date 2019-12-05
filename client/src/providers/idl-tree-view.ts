import * as vscode from 'vscode';
import * as path from 'path';

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
export const commandChildren: IChild[] = [
  {
    name: 'Open',
    descripion: 'a new IDL terminal window',
    icon: 'open-new.svg'
  },
  {
    name: 'Compile',
    descripion: 'the active PRO file',
    icon: 'settings.svg'
  },
  {
    name: 'Run',
    descripion: 'the active PRO file',
    icon: 'play.svg'
  },
  {
    name: 'Stop',
    descripion: 'the IDL interpreter',
    icon: 'stop.svg'
  },
  {
    name: 'Continue',
    descripion: 'running the IDL interpreter',
    icon: 'play.svg'
  },
  {
    name: 'In',
    descripion: 'When debugging, step into a routine call',
    icon: 'arrow-down.svg'
  },
  {
    name: 'Over',
    descripion: 'When debugging, step over a routine call',
    icon: 'arrow-over.svg'
  },
  {
    name: 'Out',
    descripion: 'When debugging, step out of a routine',
    icon: 'arrow-up.svg'
  },
  {
    name: 'Reset',
    descripion: 'the IDL session',
    icon: 'renew.svg'
  }
];

export class IDLTreeViewProvider implements vscode.TreeDataProvider<IDLAction> {
  private _onDidChangeTreeData: vscode.EventEmitter<
    IDLAction | undefined
  > = new vscode.EventEmitter<IDLAction | undefined>();
  readonly onDidChangeTreeData: vscode.Event<IDLAction | undefined> = this._onDidChangeTreeData
    .event;

  parents: { [key: string]: IDLAction };
  tree: { [key: string]: IDLAction[] };

  constructor() {
    // build our tree
    this.tree = {
      Commands: commandChildren.map(
        child =>
          new IDLAction(
            child.name,
            child.descripion,
            vscode.TreeItemCollapsibleState.None,
            child.icon
          )
      )
    };

    this.parents = {
      Commands: new IDLAction(
        'Commands',
        '',
        vscode.TreeItemCollapsibleState.Expanded,
        'assessment.svg'
      )
    };
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: IDLAction): vscode.TreeItem {
    return element;
  }

  getParent(element: IDLAction): vscode.ProviderResult<IDLAction> {
    if (this.tree[element.label]) {
      return null;
    } else {
      const parents = Object.keys(this.tree);
      for (let i = 0; i < parents.length; i++) {
        const idx = this.tree[parents[i]].map(c => c.label).indexOf(element.label);
        if (idx !== -1) {
          return this.parents[parents[i]];
        }
      }
      return null;
    }
  }

  getChildren(element?: IDLAction): Thenable<IDLAction[]> {
    // return all of our parent elements
    if (!element) {
      const keys = Object.keys(this.parents);
      return Promise.resolve(keys.map(key => this.parents[key]));
    } else {
      // check if we have parent information
      if (this.tree[element.label]) {
        return Promise.resolve(this.tree[element.label]);
      } else {
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
      this.contextValue = 'parent';
    } else {
      this.contextValue = 'child';
    }

    this.iconPath = {
      light: path.join(extensionDir, 'images', 'light', iconName),
      dark: path.join(extensionDir, 'images', 'dark', iconName)
    };
  }

  get tooltip(): string {
    return this.label + ' ' + this.version;
  }

  get description(): string {
    return this.version;
  }

  contextValue = 'IDLAction';
}
