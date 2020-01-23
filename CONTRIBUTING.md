# Contributing

This contains information about how to get set up for development with the tools!

For questions, issues, or concerns you can reach out to Zach Norman at zacharyanorman@gmail.com.

## Quick Links

- [Setup](#setup)
- [Development](#development)
- [Testing](#testing)
- [Package and Publish](#package-and-publish)

## Setup

1. From the main folder, run `npm install`. This will install the dependencies for the client and the server

2. (For publishing) Make sure `vsce` is installed globally. Use `npm i -g vsce`.

3. Additionally, this uses the [Prettier - Code Formatter](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) extension for maintaining a consistent syntax for all files. This is requried for development.

4. For consistent coding styles, you must also install [TSLnt](https://marketplace.visualstudio.com/items?itemName=ms-vscode.vscode-typescript-tslint-plugin). There is a pre-determined set of rules that makes sure all contributed code looks similar and comes from Angular's code guidelines.

5. Before major changes, if you run the npm script `npm run code-prep` it will automatically run prettier and tslint to check for linting issues.

## Development

In order to develop using the extension you need to have the typescript compiled into javascript. From the main folder, execute the following:

```
npm run watch
```

This will watch start two webpack development servers for the client and the server. On file changes, it will take a few seconds and be recompiled. You will be able to see some updates in timestamps from webpack. If having both run in the same terminal is too complicated to see when each is updated, you can use the two commands `npm run watch-client` and `npm run watch-server` from two terminal windows to get live feedback.

Once the client and server have been built, press `F5` to launch  debug session of VSCode and have fun testing features!

### Internationalization Development

From the `make-i18n` dir, run `npm start` which will start a nodemon service that watches for, recompiled, and regenerates all translation files automatically. Once these are regenerated, you will need to restart the corresponding thing you were testing.

The generated files are also used for the webview.

### Webview Development

From the `idl-webview` dir, run `npm start` which will start angular in build mode with match. This means that it will rebuild the application on changes and then you will need to reload the webview in vscode.

Pro tip: To reload the webview, just click on another tab and then switch back to the webview tab and it will reload. You can verify with the output from the debug console with the IDL extension set to **debug** mode (which will show you the HTML that gets used for making the view).

**When developing, there is a few second delay in starting the webview. The delay is significantly reduced once built as production with minifies and uses AOT to significantly speed up the loading process.**


## Testing

There are a handful of unit tests for this extension. The unit tests for the `client` use Mocha and Chai, as this is required by VSCode (to the best of my knowledge). The language server uses AVA for unit tests.

Here are the general guidelines for writing tests:

- All unit tests should have the **.spec.ts** file extension, that is how they are discovered.

- Ideally, test files should live next to the file they are testing. I.e., the test for `index.ts` would be `index.spec.ts` in the same folder.

To run all tests, use `npm run test` which will run the tests for the client and server in parallel.

### Client Testing

There are three ways to test the client, both of which are outlined below.

There are three methods because you cannot test VSCode while VSCode is open, unless in debugging mode. The first is probably the easiest.

For writing tests, see [README.md](./client/src/test/vulcan/README.md).

Notes:

- Code coverage is generated in the `coverage` folder of the `client` directory and this is not comitted to github.

- A file, `idl.extension.host.log` will be written to disk in the `client` folder with the complete output from the IDL Extension Host (not the language server). This way, if IDL hangs at all, you will have all you need to try and debug why it was hanging. Not pretty, but it gets the job done :)

___

First method:

1. Open VSCode insiders (with the expected extensions of prettier and tslint)

2. From a terminal run `npm run deploy` to build the i18n, webview, and server.

3. From the same terminal, run `npm run test-client` which will run the tests

---

Second method:

1. Close all windows of VSCode (don't worry about insiders)

2. From a terminal in the main folder, run `npm run test-client` which will compile and run the tests.

---

Third method is just:

1. Open VSCode and open this repository as a folder.

2. Navigate to the **Debugging** tab

3. In the top left, select the task "Run IDL Extension Tests".

    This will start watching and compiling typescript files and **should** start a session of VSCode for running the unit tests in the `client`.

4. If a second window of VSCode does not appear, you may need to press again

5. Wait a few seconds and, in the **Debug Console** you should see the output of the tests. Once complete, the second session of VSCode will automatically close.

### Language Server Testing

For the language server, using AVA allows the typescript files to be compiled on the fly. While this is a super-handy feature, you have to be aware of what javascript files may have been precompiled and already exist in the `dist` subdirectory which can make things act goofy and sometimes call the JS and TS versions of compiled tests. Ideally you are running the the tests. So, do one of the following steps to test the server:

1. From the main directory run `npm run test-server`

OR

2. Navigate to the `server` folder and run `npm test`

OR

3. Navigate to the server` folder and run `npm run watch:test` which will live-reload and re-run tests as they are updated. How neat is that!?

Here are some helpful links if you aren't familiar with AVA:

- [AVA](https://github.com/avajs/ava)

- [AVA Documentation](https://github.com/avajs/ava#documentation)

## Syntax Highlighting

Helpful hints for debugging syntax highlighting and tokenization:

[https://code.visualstudio.com/api/language-extensions/syntax-highlight-guide#scope-inspector](https://code.visualstudio.com/api/language-extensions/syntax-highlight-guide#scope-inspector)

## Package and Publish - Requires Special Access to Azure

**This must be done from a command prompt and not from VSCode because of the tests that are automatically run.**

**When publishing releases you should**:

1. Increment the version in `package.json` to the next desired version

2. Execute `vsce package` to validate that we can compile and run all of our tests without a problem. You need the `vsce` package installed globally with NPM

    ```
    npm i -g vsce
    vsce package
    ```

    When package is executed, the `vsce:prepublish` script in the main `package.json` file is automatically called. This script will build the typescript and execute unit tests. Once finished, all of the items in the repository aare collected and made into a `.vsix` file. You can then test this out locally and, once you verify it works correctly, then you can go to the next step.

3. Document changes in **CHANGELOG.md**

4. Push all changes to GitHub

5. Make release on GitHub

6. Attach `.vsix` file to GitHub release, you may need to run `vsce pacakge` again to regenerate the extension file.

7. Publish the release to the VSCode Marketplace with:

    ```
    vsce publish -p YOUR_ACCESS_TOKEN
    ```

    This will repackage the extension which will re-run all of the tests as well.

    This will also prompt you for a personal access token for the `CT6502` group. If you are a member, paste your key and then it will automatically upload. The access token comes from [dev.azure.com/ct6502](dev.azure.com/ct6502). Specifically it can be found at [dev.azure.com/ct6502/_usersSettings/tokens](dev.azure.com/ct6502/_usersSettings/tokens) which comes from Profile -> Personal Access Tokens.

### Errors with Testing

If you are packaging the extension, make sure that you have VSCode closed before starting and that you are on a command prompt.

When testing, if you have VSCode hang with this message:

```
[main 2019-09-03T15:29:47.100Z] update#setState idle
[main 2019-09-03T15:30:17.103Z] update#setState checking for updates
[main 2019-09-03T15:30:17.485Z] update#setState idle
```

Then you need to launch the tests from VSCode first which seems to get it out of a bad state. Not quite sure what is going on there, but that is how we fix it.