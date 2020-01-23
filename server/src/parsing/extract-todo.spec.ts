import test from 'ava';
import { Diagnostic } from 'vscode-languageserver';
import { extractToDo } from './extract-todo';

test('That we extract todos', t => {
  // compare single extraction
  const c: Diagnostic[] = [
    {
      severity: 3,
      message: 'TODO: something',
      range: { start: { line: 0, character: 2 }, end: { line: 0, character: 17 } }
    }
  ];
  t.deepEqual(c, extractToDo('; TODO: something'));
});
