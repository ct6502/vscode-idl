import * as path from 'path';
import * as vscode from 'vscode';
import { getExtensionDir, idlLogger, idlTranslation, idlTreeClickHandler } from '../extension';
import { COMMAND_BUTTONS, TERMINAL_BUTTONS } from './idl-tree-view.interface';

export class IDLTreeViewProvider implements vscode.TreeDataProvider<IDLAction> {
  parents: { [key: string]: IDLAction };
  tree: { [key: string]: IDLAction[] };
  onDidChangeTreeData: vscode.Event<IDLAction | undefined>;
  private _onDidChangeTreeData: vscode.EventEmitter<
    IDLAction | undefined
  > = new vscode.EventEmitter<IDLAction | undefined>();

  constructor() {
    this.onDidChangeTreeData = this._onDidChangeTreeData.event;

    // build our tree
    this._buildTree();
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: IDLAction): vscode.TreeItem {
    return element;
  }

  getParent(element: IDLAction): vscode.ProviderResult<IDLAction | null> {
    if (this.tree[element.label]) {
      return null;
    }

    const parents = Object.keys(this.tree);
    for (let i = 0; i < parents.length; i++) {
      const idx = this.tree[parents[i]].map(c => c.label).indexOf(element.label);
      if (idx !== -1) {
        return this.parents[parents[i]];
      }
    }
    return null;
  }

  getChildren(element?: IDLAction): Thenable<IDLAction[]> {
    // return all of our parent elements
    switch (true) {
      case !element:
        const keys = Object.keys(this.parents);
        return Promise.resolve(keys.map(key => this.parents[key]));
      case element.label in this.tree:
        return Promise.resolve(this.tree[element.label]);
      default:
        return Promise.resolve([]);
    }
  }

  createView() {
    // listen for events and register
    const treeView = vscode.window.createTreeView('idl-tree', {
      treeDataProvider: this
    });

    // listen for when we click on items in the tree view
    treeView.onDidChangeSelection(async event => {
      // handle our click event
      try {
        await idlTreeClickHandler.clickedItem(event.selection[0]);
        const kids = await this.getChildren();
        await treeView.reveal(kids[0], { select: true });
      } catch (err) {
        idlLogger.log({
          level: 'error',
          content: ['Error while handling selection change in IDL tree', err],
          alert: true,
          alertMessage: idlTranslation.idl.tree.selectionChangeError
        });
      }
    });
  }

  private _buildTree() {
    // make our child nodes
    this.tree = {};
    this.tree[idlTranslation.idl.tree.parents.terminal] = TERMINAL_BUTTONS.map(
      child =>
        new IDLAction(
          child.name,
          child.descripion,
          vscode.TreeItemCollapsibleState.None,
          child.icon,
          child.commandName
        )
    );
    this.tree[idlTranslation.idl.tree.parents.commands] = COMMAND_BUTTONS.map(
      child =>
        new IDLAction(
          child.name,
          child.descripion,
          vscode.TreeItemCollapsibleState.None,
          child.icon,
          child.commandName
        )
    );

    // make our parent nodes
    this.parents = {};
    this.parents[idlTranslation.idl.tree.parents.terminal] = new IDLAction(
      // override type, OK becuase click handler ignores parents
      idlTranslation.idl.tree.parents.terminal,
      '',
      vscode.TreeItemCollapsibleState.Expanded,
      'terminal.svg',
      ''
    );
    this.parents[idlTranslation.idl.tree.parents.commands] = new IDLAction(
      // override type, OK becuase click handler ignores parents
      idlTranslation.idl.tree.parents.commands,
      '',
      vscode.TreeItemCollapsibleState.Expanded,
      'add-box.svg',
      ''
    );
  }
}

export class IDLAction extends vscode.TreeItem {
  get tooltip(): string {
    return this.label + ' ' + this.version;
  }

  get description(): string {
    return this.version;
  }

  contextValue = 'IDLAction';
  constructor(
    readonly label: string,
    private version: string,
    readonly collapsibleState: vscode.TreeItemCollapsibleState,
    private iconName: string,
    readonly commandName: string
  ) {
    super(label, collapsibleState);

    // check if we are a parent or child
    this.contextValue =
      collapsibleState === vscode.TreeItemCollapsibleState.Expanded ? 'parent' : 'child';

    const extDir = getExtensionDir();

    this.iconPath = {
      light: path.join(extDir, 'images', 'light', iconName),
      dark: path.join(extDir, 'images', 'dark', iconName)
    };
  }
}
