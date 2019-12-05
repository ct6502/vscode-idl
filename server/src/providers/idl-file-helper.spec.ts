import test from 'ava';
import { TextDocuments } from 'vscode-languageserver';
import { IDL } from './idl';
import { ReturnTestFile } from '../test/helper.spec';

// make the object
const idl = new IDL(new TextDocuments());

// get things and stuff
const uri = ReturnTestFile('addition.pro');

test('Strip comments from strings', t => {
  // trim comment
  t.is(idl.files._trimLine('a = b + c;test with comments'), 'a = b + c');

  // trim white space and comment
  t.is(idl.files._trimLine('a = b + c    ;test with comments'), 'a = b + c');

  // trim all, just comment here
  t.is(idl.files._trimLine(';test with comments'), '');

  // comment in singel quotes
  t.is(idl.files._trimLine("';test with comments'     ; comments"), "';test with comments'");
  t.is(
    idl.files._trimLine("';test with comments' + 'something else' ; comments"),
    "';test with comments' + 'something else'"
  );

  // comment in double quote strings
  t.is(idl.files._trimLine('";test with comments" ; comments'), '";test with comments"');
  t.is(
    idl.files._trimLine('";test with comments"  + "this"   ; comments'),
    '";test with comments"  + "this"'
  );
});

test('Cleaned: no comments or traling whitespace, but same lines', t => {
  // get our strings, also makes clean strings
  idl.files.getFileStrings(uri);

  const expected = [
    'pro addition, A=a, $',
    '              B=b, $',
    '              RESULT=result, $',
    '              C=c',
    '  compile_opt idl2',
    '  some$thing',
    '  data = sin(2.0*findgen(200)*!PI/25.0)*EXP(exponent*FINDGEN(200))',
    '  if (c eq !NULL) then begin',
    '    result = a + b',
    '  endif else begin',
    '    result = a + b + c',
    '  endelse',
    '  if (c eq !null) then result = 5 else result = 6',
    'end'
  ];

  t.deepEqual(idl.files.cleanStrings[uri], expected);
});

test('Cleaned: no empty lines or comments', t => {
  const expected = [
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    'pro addition, A=a, $',
    '              B=b, $',
    '              RESULT=result, $',
    '              C=c',
    '  compile_opt idl2',
    '',
    '  some$thing',
    '  data = sin(2.0*findgen(200)*!PI/25.0)*EXP(exponent*FINDGEN(200))',
    '  if (c eq !NULL) then begin',
    '    result = a + b',
    '  endif else begin',
    '    result = a + b + c',
    '  endelse',
    '  if (c eq !null) then result = 5 else result = 6',
    '',
    'end'
  ];

  t.is(idl.files.getFileString(uri), expected.join('\n'));
});
