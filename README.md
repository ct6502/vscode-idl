# VS Code IDL (Interactive Data Language) Extension

This extension adds syntax highlighting and code snippets for the Interactive Data Language (IDL) from Harris Geospatial Solutions (formerly Research Systems, Inc.).

The TextMate files and code snippets are originally from Mike Galloy's [idl.tmbundle](https://github.com/mgalloy/idl.tmbundle).

The JSON syntax rules for the `.task` files are from [VSCode](https://github.com/Microsoft/vscode-JSON.tmLanguage) and are included so that you don't have to edit file associations for them to look correct.

For developers, see [CONTRIBUTING.md](./CONTRIBUTING.md) for notes on getting your environment setup.

## Features

* Function/procedure completion for  built in ENVI + IDL routines

* Go-to definition for functions and procedures (not methods)

* Search for procedure/function definitions through symbols

* Duplicate routine definition detection for files open in VSCode or a workspace, not for IDL's search path

* Duplicate routine definition detection against documented ENVI + IDL routines

* Support for VSCode's auto-comment (Ctrl+/ or command+/)

* Syntax highlighting and coloring

* Code snippets for common code blocks

* Colorization of ENVI and IDL task files.

* Ability to launch a basic IDL Console window and buttons similar to the IDL Workbench. Note that debugging is not a part of this.

## Notes

- The actual code that gets highlighted is strongly dependent on your theme. Themes such as Abyss, Atom One Dark (extension), Dark+ (default dark), or Monokai show the most color. 

- The previous issue for line continuations, where arguments were being colored as procedures has been resolved. In order to have the line continuation correctly highlight your code, you will **need** to have the next line indented such as:

```idl
someProcedure,$
  nextLine
```

This should be something that you are doing in your code anyways, so it shouldn't cause problems for most people. If you do not do this, then procedures will not be colored until your next line with an indentation and no `$` character. If this is an issue, let us know on the GitHub page via an issue and we will take a look at improving this functionality.

## Known Issues

- Properties will not highlight if being accessed directly from square brackets such as `trace[-3].LINE`. 

- When you have code blocks from line continuations a property will not be colored correctly if at the start of the line. Here is an example of the syntax that won't highlight correctly:

```idl
someProcedure,$
  nextLine.property,
```

## Release Notes

See [CHANGELOG](CHANGELOG.md).

## Contributors

Thanks goes to these wonderful people ([emoji key](https://github.com/kentcdodds/all-contributors#emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore -->
| [<img src="https://avatars3.githubusercontent.com/u/5461379?v=4" width="100px;"/><br /><sub><b>Chris Torrence</b></sub>](https://github.com/chris-torrence)<br />[💻](https://github.com/chris-torrence/vscode-idl/commits?author=chris-torrence "Code") [🎨](#design-chris-torrence "Design") [📦](#platform-chris-torrence "Packaging/porting to new platform") | [<img src="https://avatars1.githubusercontent.com/u/31664668?v=4" width="100px;"/><br /><sub><b>Zachary Norman</b></sub>](https://github.com/znorman-harris)<br />[💻](https://github.com/chris-torrence/vscode-idl/commits?author=znorman-harris "Code") [🎨](#design-znorman-harris "Design") [📖](https://github.com/chris-torrence/vscode-idl/commits?author=znorman-harris "Documentation") | [<img src="https://avatars2.githubusercontent.com/u/713524?v=4" width="100px;"/><br /><sub><b>Michael Galloy</b></sub>](http://michaelgalloy.com)<br />[💻](https://github.com/chris-torrence/vscode-idl/commits?author=mgalloy "Code") [🔌](#plugin-mgalloy "Plugin/utility libraries") |
| :---: | :---: | :---: |
<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/kentcdodds/all-contributors) specification. Contributions of any kind welcome!