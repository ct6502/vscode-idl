# VS Code IDL (Interactive Data Language) Extension

This extension adds syntax highlighting and code snippets for the Interactive Data Language (IDL) from Harris Geospatial Solutions (formerly Research Systems, Inc.).

The TextMate files and code snippets are originally from Mike Galloy's [idl.tmbundle](https://github.com/mgalloy/idl.tmbundle).

The JSON syntax rules for the `.task` files are from [VSCode](https://github.com/Microsoft/vscode-JSON.tmLanguage) and are included so that you don't have to edit file associations for them to look correct.

## Features

* Support for VSCode's auto-comment (Ctrl+/ or command+/)

* Syntax highlighting and coloring

* Code snippets for common code blocks

* Colorization of ENVI and IDL task files.

## Notes

- The actual code that gets highlighted is strongly dependent on your theme. Themes such as Abyss, Atom One Dark (extension), Dark+ (default dark), or Monokai show the most color. 

For line continuations, procedures being incorrectly colored has been resolved. In order to have the line continuation correctly highlight your code, you will **need** to have the next line indented such as:

```idl
someProcedure,$
  nextLine
```

You should be doing this anyways in your code, but if you don't, then the highlighting of the rest of the code will be thrown off until you have a line with an indentation and no line continuation character.

## Known Issues

- Properties will not highlight correctly if being accessed directly from square brackets such as `trace[-3].LINE`. 

- When you have code blocks from line continuations (the `$`), sometimes procedures are highlighted incorrectly on the next line

```idl
someProcedure,$
  nextLine,
```

## Release Notes

See [CHANGELOG](CHANGELOG.md).
