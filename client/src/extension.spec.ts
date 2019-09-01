import * as vscode from "vscode";
import * as path from "path";
import * as assert from "assert";
import { before, it, after, beforeEach, afterEach } from "mocha";
import * as chai from "chai";
import { expect } from "chai";
import "chai/register-should";
import * as chaiAsPromised from "chai-as-promised";
chai.use(chaiAsPromised);

export let doc: vscode.TextDocument;
export let editor: vscode.TextEditor;
export let documentEol: string;
export let platformEol: string;

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const getDocPath = (p: string) => {
  return path.resolve(__dirname, "../../testFixture", p);
};
export const getDocUri = (p: string) => {
  return vscode.Uri.file(getDocPath(p));
};

export async function setTestContent(content: string): Promise<boolean> {
  const all = new vscode.Range(doc.positionAt(0), doc.positionAt(doc.getText().length));
  return editor.edit(eb => eb.replace(all, content));
}

/**
 * Activates the vscode.lsp-sample extension
 */
export async function activate(docUri: vscode.Uri) {
  // The extensionId is `publisher.name` from package.json
  const ext = vscode.extensions.getExtension("ct6502.idl");
  await ext.activate();
  try {
    doc = await vscode.workspace.openTextDocument(docUri);
    editor = await vscode.window.showTextDocument(doc);
    await sleep(2000); // Wait for server activation
    return true;
  } catch (e) {
    throw new Error(e);
  }
}

const uri = vscode.Uri.file(
  "C:\\Users\\zach\\Documents\\github\\vscode-idl\\tests\\code_snippets.pro"
);

const mochaAsync = fn => {
  return done => {
    fn.call().then(done, err => {
      done(err);
    });
  };
};

// track if we fail anything
let FAILED_STARTUP = false;

// Skip test if first test from folder failed
beforeEach(function() {
  if (FAILED_STARTUP) {
    this.skip();
  }
});

suite("Verify we can start the client and language server", () => {
  before(() => {
    vscode.window.showInformationMessage("Starting all tests.");
  });

  afterEach(function() {
    if (this.currentTest.state === "failed") {
      FAILED_STARTUP = true;
    }
  });

  // DONT USE DONE WITH ASYNC FUNCTIONS
  // STUPID MOCHA https://github.com/mochajs/mocha/issues/2738
  it("Verify the extension activates", async function() {
    this.timeout(5000);
    assert.equal(await activate(uri), true);
  });
});

suite("Second test suite", () => {
  before(() => {
    vscode.window.showInformationMessage("Starting all tests.");
  });

  after(function() {
    let failed = false;
    this.test.parent.tests.forEach(test => {
      failed = test.state === "failed";
    });
    if (failed) {
      throw new Error("Failed, test cannot continue");
    }
  });

  // DONT USE DONE WITH ASYNC FUNCTIONS
  // STUPID MOCHA https://github.com/mochajs/mocha/issues/2738
  it("Dummy test to see if it passes/failsf rom above", function() {
    assert.equal(true, true);
  });
});
