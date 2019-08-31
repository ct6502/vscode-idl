import test from "ava";
import { TextDocuments, DocumentSymbol } from "vscode-languageserver";
import { IDL } from "./idl";
import { ReturnTestFile, FileToDocumentSymbolParams } from "../test/helper.spec";

const documents: TextDocuments = new TextDocuments();

test("object creation", async t => {
  const idl = new IDL(documents);
  t.assert(idl);

  const res: any = await idl.getDocumentOutline(
    FileToDocumentSymbolParams(ReturnTestFile("addition.pro"))
  );
  const compare = [
    {
      name: "addition",
      detail: "Procedure",
      kind: 12,
      children: undefined,
      range: {
        start: { line: 16, character: 4 },
        end: { line: 16, character: 12 }
      },
      selectionRange: {
        start: { line: 16, character: 4 },
        end: { line: 16, character: 12 }
      }
    }
  ];

  t.deepEqual(res, compare);
});
