# Change Log
All notable changes to the "idl" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [1.5.1] - 2019-08-23

Webpacked the language server to reduce files by about 50% and size to 3.3 MB from about 5 MB

## [1.5.0] - 2019-08-23

Added an initial IDL language server for more features. It contains capabilities for:

- Searching through symbols (procedure/function/method definitions) with VScode's symbol searching

- Support for finding routine definitions in a workspace

- Go-to definitions for routines

- Auto-complete for built-in IDL routines when typing procedures or functions out

- Duplicate routine definition detection for files open in VSCode or the workspace, not for IDL's search path

- Duplicate routine definition detection against documented ENVI + IDL routines

- Simple controls for starting a basic IDL Console window with the ability to compile, run, and stop executing IDL code. There is no debugging, but it is better than nothing!

## [1.4.1] - 2019-05-16

Bump required vscode version to 1.33.0 to resolve security vulnerabilities.

## [1.3.0] - 2018-04-11

Added new package to packge.json for adding contributors. Updated the readme and added attribution to Mike Galloy, Chris Torrence, and Zach Norman.

A lot of changes have been made to improve the colorization of IDL's procedures which are challenging to delineate from standard text. In general here are the changes that have been made:

- Added a "test" file with many sample cases for easy comparison when testing the syntax highlighting. Any problems are at the top of the file, exerything else is a reference for what things should look like.

- Procedures now highlight correctly when you have single-line if statements of the form `if (this) then print, 'that'`. Does **not** work if you have a line continuation after the `then` statement.

- Added code for line continuations to prevent false positive procedures from beign highlighted. This requires you to indent the next line (as you should anyways) otherwise the rest of your file is highlighted incorrectly. With this change, properties are not colored correctly on the next line. Not sure why this is happening, I'm guessing another group is grabbing the text and preventing the highlighting, but this is better than highlighting too much. Holding off on exposing this as it has the potential to cause more problems than it solves.

- Some of the procedure captures have been consolidated and simplified.

- New groups have been added in the tmLanguage file for braces, switch-case, and line continuations. See the note on line continuations above.

- With the new capture groups, structure tag names have been limited to braces.

- With the new capture groups, there is special syntax to highlight procedures and procedure methods correctly inside switch or case blocks.

- Fix with properties highlighting correctly in elvis operators, i.e. `(this) ? something.that : this.that`

- Snippets have been improved and organized (may have been snuck into the last release)

- Added the all-contributors NPM package to the package.json file for adding a nice attribution section to the README as other people contribute.

## [1.1.0] - 2018-04-02

- Organized and restructured the language file

- Registered the `;` as the comment character for IDL and VSCode's auto-comment feature now works as expected.

- The syntax highlighting is now generic and will highlight any function, procedure, function method, or procedure method accordingly.

- Structure/object properties are highlighted when setting/getting, includng those on system variables.

- Structure names and `inherits` keys have their own styling.

- Structure tag names have their own styling

- Executive commands are styled

- All system variables now highlight correctly.

- There is code for colorizing structure tag names, but it has too many false positives when accessing arrays with syntax like `arr[start:finish]` so it has been commented out.

- .task files are now colored as JSON thanks to [VSCode](https://github.com/Microsoft/vscode-JSON.tmLanguage) 

## [1.0.0] - 2018-01-08

- Initial release

- Includes snippets and idl.tmLanguage from Mike Galloy
