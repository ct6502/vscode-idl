import { Diagnostic, DiagnosticSeverity, Position, Range } from 'vscode-languageserver';

export function extractToDo(text: string): Diagnostic[] {
  // init found todoss
  const todos: Diagnostic[] = [];

  // find all function definitions
  const todoRegex = /^( *; *)(TODO(?=:).*)$/gim;
  let m: RegExpExecArray;
  while ((m = todoRegex.exec(text)) !== null) {
    // This is necessary to avoid infinite loops with zero-width matches
    if (m.index === todoRegex.lastIndex) {
      todoRegex.lastIndex++;
    }

    // get the line of this character
    const split = text.substr(0, m.index).split('\n');
    const lineNumber = split.length - 1;
    const start = split[split.length - 1].length; // length of string start

    // track how much to add
    let add = 0;

    // The result can be accessed through the `m`-variable.
    m.forEach((match, groupIndex) => {
      switch (true) {
        case groupIndex === 0:
          return;
        case groupIndex === 1:
          add += match.length;
          return;
        default:
          break;
      }

      // build the location of the match
      const range = Range.create(
        Position.create(lineNumber, start + add),
        Position.create(lineNumber, start + match.length + add)
      );

      // save
      todos.push({ severity: DiagnosticSeverity.Information, message: match, range: range });
    });
  }

  // return our symbols
  return todos;
}
