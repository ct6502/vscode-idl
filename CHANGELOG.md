# Change Log

All notable changes to the "idl" extension will be documented in this file.

## 2.1.0

Removed all functionality and auto-installs new extension.

## 2.0.1 - 2020-01-22

- Fixed a bug with hover help

- Issues with debugging, so removing features associated (debugging, commands, and webview)

## 2.0.0 - 2020-01-14

Lots of exciting changes!

- Terminal Commands

    - These allow you to run IDL in the VSCode terminal window without interactive debugging functionality

- Preferences

    - Basic preferences to help out

- Themes! Feeling retro? Check out the `Retro IDL` theme. In the mood for a modern, dark theme? Experience IDL syntax highlighting with the `Novus IDL` color theme. See the **Credits** section of the readme for the original source of the themes.

    - If you feel like customizing the IDL themes, check out the theme JSON files. The IDL tokens are all at the top and it is pretty easy to customize the way PRO code appears. Pro tip: if you do this, VSCode does a live-reload so you can see your changes instantly!

- Code refactor. Not as exciting, but we have a good number of *major* changes to the way the code in the repository is written:

    - TSLint (although it will soon be deprecated) and steps for getting able to contribute

    - Prettier and TSLint integrated into the node scripts prior to packaging to force the code to have the same style

    - All files have been adjusted according to prettier and TSLint

- Syntax highlighting

    - When pairing the themes with this extension, there were a few bugs fixed with the colors not appearing right based on your color theme.

    - There is separation in color between functions, procedures, function methods, and procedure methods. There is no delineation between user defined and internal routines at this point. The highlighting also extends to where they are defined in PRO code.

- Tree view

    - New tabs and buttons for executing additional commands by clicking n buttons

    - Some updated icons as well

- Support for internationalization (i18n)

    - For client (ext) and webview as well. All new code should be written to support i18n so that we will always be covered.

    - Custom workflow for generating the files needed for i18n which is simple, used for the whole extension, and error-proofs users from having missing JSON key/value pairs or typos with JSON keys.

- Logging

    - Proper extension logging when not launching extension in debug mode.

    - Error messages prompt the user by default to view logs.

- Additional Development Updates:

    - Migration to webpack for the extension client

    - Total extension size is about 1.2 MB with 73 files, most of which are images and necessary files for the language!

    - As new folders have been added, migrated all content specific for the language to the `language` folder to keep things more organized.

- Workspaces:

    - Properly listen for files being added and removed from workspace

    - Fixed a *major* bug where the glob library used for file searching would exceed the call stack and we wouldn't have our true intellisense.

- Support for `todo` statements if they follow the form of:

    - `; TODO: some note here` where the actual `TODO` can be upper or lower case

## [1.7.0] - 2019

Added commands for the buttons added to the sidebar

Enhanced the way that IDL is auto-detected on Mac + Linux by chekcing IDL_DIR (from idl_setup.sh in the install location)

## [1.6.1] - 2019-10-05

Fixed a bug with problem detection that didn't properly clear

Updated dependencies to VSCode 1.38

## [1.6.0] - 2019-09-03

Small syntax fix for control statements in keywords

New feature with hover help for built-in routines in IDL. Returns first match found if the names are the same as the symbol being extracted.

Hover help returns markdown with link to the official docs for built-in routines

Logic for detecting symbols for hover and auto-complete

- Aware of function, procedure, and method

- Completion results are then returned based on what symbol is extracted, so we have situational-appropriate results. For example, function auto-completes when we have a `(` in our name or an equal sign on the left hand side. This also helps speed things up.

- Added in all ENVI + IDL object methods, so that is why we needed search filtering. Our total went from about 1300 to 4000 docs entries

- Refactored the storage and addition of symbols for user-defined routines for faster access and easier cleanup when closing documents

## [1.5.5] - 2019-09-01

These features are mostly development updates and not super exciting, new features.

Server: abstracted providers/helpers and wrapped in single API for being able to test

Added testing to the extension:

    - Use mocha for testing the extension **client**

    - Use AVA for testing the extension **server**

    - NPM script from main folder to run all tests

When publishing/packaging the extension, unit tests are automatically executed which also builds the extension.

    - **BREAKING CHANGE FOR DEVELOPMENT:** You can no longer publish from a terminal in vscode and no terminals can be active. This is because of the vscode examples followed for how tests are executed.

Bundle size is about 700kb compared to previous size of 2.8mb.

    - Number of files is ~160 compared to ~1k

    - Reductions came from using `@types/vscode` instead of `vscode`and manually excluded some node modules used just for development.

Linting with prettier added back in

    - **BREAKING CHANGE FOR DEVELOPMENT**: Required VSCode and the [Prettier - Code Formatter](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) extension. Settings are saved in this repository.

## [1.5.4] - 2019-08-29

Fixed regex for variables, it was picking up multi-line statements.

## [1.5.3] - 2019-08-27

Auto complete for variables in-file and all routines that have been discovered for your instance of VScode (from workspace and files you have opened)

Fix for incorrect syntax highlighting of the control statement `end`

Enhanced (and fixed) go-to definitions for functions, procedures, and methods (procedure and function)

## [1.5.2] - 2019-08-25

Corrected the way to add syntax for IDL + ENVI tasks, ENVI style sheets, and ENVI modeler files.

Added basic task schema validation for:

- ENVI Tasks before ENVI 5.3

- ENVI Tasks after ENVI 5.3

- IDL Tasks, which were introduced in IDL 8.5.2

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

Added new package to package.json for adding contributors. Updated the readme and added attribution to Mike Galloy, Chris Torrence, and Zach Norman.

A lot of changes have been made to improve the colorization of IDL's procedures which are challenging to delineate from standard text. In general here are the changes that have been made:

- Added a "test" file with many sample cases for easy comparison when testing the syntax highlighting. Any problems are at the top of the file, everything else is a reference for what things should look like.

- Procedures now highlight correctly when you have single-line if statements of the form `if (this) then print, 'that'`. Does **not** work if you have a line continuation after the `then` statement.

- Added code for line continuations to prevent false positive procedures from being highlighted. This requires you to indent the next line (as you should anyways) otherwise the rest of your file is highlighted incorrectly. With this change, properties are not colored correctly on the next line. Not sure why this is happening, I'm guessing another group is grabbing the text and preventing the highlighting, but this is better than highlighting too much. Holding off on exposing this as it has the potential to cause more problems than it solves.

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

- Structure/object properties are highlighted when setting/getting, including those on system variables.

- Structure names and `inherits` keys have their own styling.

- Structure tag names have their own styling

- Executive commands are styled

- All system variables now highlight correctly.

- There is code for colorizing structure tag names, but it has too many false positives when accessing arrays with syntax like `arr[start:finish]` so it has been commented out.

- .task files are now colored as JSON thanks to [VSCode](https://github.com/Microsoft/vscode-JSON.tmLanguage)

## [1.0.0] - 2018-01-08

- Initial release

- Includes snippets and idl.tmLanguage from Mike Galloy
