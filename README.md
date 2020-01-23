# VS Code IDL (Interactive Data Language) Extension

**2.0.1 is here!** This release offers many exciting and new features. With all these new features, there also may be some undocumented software enhancements (i.e. bugs). For these please use [GitHub](https://github.com/chris-torrence/vscode-idl) to file bug/feature requests. There is also a quick link for submitting bugs for the extension in the IDL View.

**Note that, due to issues with debugging, the feature has been temporarily removed**

See below and the CHANGELOG for full details.

---

Created and maintained by current and past members of the IDL + ENVI team.

This extension adds syntax highlighting, code snippets, debugging, and much more for the Interactive Data Language (IDL) from Harris Geospatial Solutions (formerly Research Systems, Inc.).

If you are looking to contribute, see [CONTRIBUTING.md](./CONTRIBUTING.md) for notes on getting your environment setup.

For a full list of changes, see [CHANGELOG.md](./CHANGELOG.md) for lots of details.

## Features

* Terminal commads. Ability to run IDL from a terminal window with commands except for the ability to debug.

* Custom IDL color themes. If you are feeling retro, then the IDL Light theme is for you! It replicates the IDL Workbench theme colors.

* Finds `TODO` statements just like the workbench

* Function/procedure completion for built in ENVI + IDL routines

* Function/procedure/variable completion for user defined routines in workspaces and opened files

* Hover help for core ENVI and IDL routines, includng links to the official documentation

* Go-to definition for functions, procedures, and methods from user defined routines

* Search for procedure/function definitions through symbols

* Duplicate routine definition detection for files open in VSCode or a workspace, not for IDL's search path

* Duplicate routine definition detection against documented ENVI + IDL routines

* Support for VSCode's auto-comment (Ctrl+/ or command+/)

* Syntax highlighting and coloring

* Code snippets for common code blocks

* Colorization of ENVI and IDL task files.

* Ability to launch a basic IDL Console window and buttons similar to the IDL Workbench. Note that debugging is not a part of this.

* Schema validation for all versions of ENVI and IDL tasks to simplify development.

* Commands (Ctrl+shift+p) for terminal sessions:

    - Opening an IDL session

    - Compiling

    - Running PRO files (run button in the workbench)

    - Executing PRO files as batch files (single line statements)

    - Execution controls (stop, in, over, out) for IDL in a terminal

    - Plus some others!

* Support for internationalization

    - Submit a bug/feature for adding languages. Hopefully they are for a language that you speak, so you could also help with the translation :)

## Notes

- Method auto complete has basic variable logic, if there are issues with items not coming up, please submit an issue with a reproduce case on github so that we can make this better.

- File searching in indexed workspaces honors your `.gitignore` files, so if you don't see routines that you expect, that may be why. If you don't like this behavior, make an issue on github and we can make a preference for this.

- For task schema validation, the JSON in the `.task` file must contain a `"schema"` tag which indicates the rulesets for which parameters are required. For older ENVI Tasks, you need `"version"`.

- The actual code that gets highlighted is strongly dependent on your theme. Themes such as Abyss, Atom One Dark (extension), Dark+ (default dark), or Monokai show the most color. 

- The previous issue for line continuations, where arguments were being colored as procedures has been resolved. In order to have the line continuation correctly highlight your code, you will **need** to have the next line indented such as:

```idl
someProcedure,$
  nextLine
```

This should be something that you are doing in your code anyways, so it shouldn't cause problems for most people. If you do not do this, then procedures will not be colored until your next line with an indentation and no `$` character. If this is an issue, let us know on the GitHub page via an issue and we will take a look at improving this functionality.

## Future Plans

Goals for features to add (not necessarily in this order):

- Go-to definition for variables.

- Hover help for user defined routines.

    Need to decide if this uses the code or code comments - maybe both if no comments, to derive this information.

- Figure out how to have a more "aware" editor, meaning symbol definitions for things like type (objects, numbers, arrays, strings). This is a challaenge because we don't have that information for most of IDL.

    This includes being able to access properties which for user-defined objects, means we need to know the object source, inheritance, and the properties along the chain.

- Linting would be nice - mostly for code formatting more than rule following lilke eslint or tslint.



## Known Issues

- Properties will not highlight if being accessed directly from square brackets such as `trace[-3].LINE`. 

- When you have code blocks from line continuations a property will not be colored correctly if at the start of the line. Here is an example of the syntax that won't highlight correctly:

```idl
someProcedure,$
  nextLine.property,
```

## Release Notes

See [CHANGELOG](CHANGELOG.md).

## Credits

The TextMate files and code snippets are originally from Mike Galloy's [idl.tmbundle](https://github.com/mgalloy/idl.tmbundle).

The original source of the themes came from the [Atom One Light Theme](https://github.com/akamud/vscode-theme-onedark) and [Atom One Dark Theme](https://github.com/akamud/vscode-theme-onelight)

    - Licensed under MIT. Copyright (c) 2015 Mahmoud Ali

    - See the license files in `./language/themes` for the full MIT license and copyright.

## Contributors

Thanks goes to these wonderful people ([emoji key](https://github.com/kentcdodds/all-contributors#emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore -->
| [<img src="https://avatars3.githubusercontent.com/u/5461379?v=4" width="100px;"/><br /><sub><b>Chris Torrence</b></sub>](https://github.com/chris-torrence)<br />[💻](https://github.com/chris-torrence/vscode-idl/commits?author=chris-torrence "Code") [🎨](#design-chris-torrence "Design") [📦](#platform-chris-torrence "Packaging/porting to new platform") | [<img src="https://avatars1.githubusercontent.com/u/31664668?v=4" width="100px;"/><br /><sub><b>Zachary Norman</b></sub>](https://github.com/znorman-harris)<br />[💻](https://github.com/chris-torrence/vscode-idl/commits?author=znorman-harris "Code") [🎨](#design-znorman-harris "Design") [📖](https://github.com/chris-torrence/vscode-idl/commits?author=znorman-harris "Documentation") | [<img src="https://avatars2.githubusercontent.com/u/713524?v=4" width="100px;"/><br /><sub><b>Michael Galloy</b></sub>](http://michaelgalloy.com)<br />[💻](https://github.com/chris-torrence/vscode-idl/commits?author=mgalloy "Code") [🔌](#plugin-mgalloy "Plugin/utility libraries") |
| :---: | :---: | :---: |
<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/kentcdodds/all-contributors) specification. Contributions of any kind welcome!