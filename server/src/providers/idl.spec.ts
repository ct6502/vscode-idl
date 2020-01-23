import test from 'ava';
import { DocumentSymbol, TextDocuments } from 'vscode-languageserver';
import { FileToDocumentSymbolParams, ReturnTestFile } from '../test/helper.spec';
import { IDL } from './idl';

const documents: TextDocuments = new TextDocuments();

// placeholder for variable
let idl: IDL;

test('IDL object creation', t => {
  // get start time, to check how long it takes
  const start = process.hrtime();

  // make the object
  idl = new IDL(documents);

  // get how long it took
  const finish = process.hrtime(start);

  // verify that we made an object
  t.assert(idl);

  // alert user how long it took
  t.log('Creation time (ms):', finish[1] / 1000000);
});

test('Simple document outline', async t => {
  const res: any = await idl.getDocumentOutline(
    FileToDocumentSymbolParams(ReturnTestFile('addition.pro'))
  );
  const compare = [
    {
      name: 'addition',
      detail: 'Procedure',
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
