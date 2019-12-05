# Contributing

This contains information about how to get set up for development with the tools!

For questions, issues, or concerns you can reach out to Zach Norman at zacharyanorman@gmail.com.

## Quick Links

- [Setup](#setup)
- [Development](#development)
- [Testing](#testing)
- [Package and Publish](#package-and-publish)

## Setup

From the main folder, run `npm install`, this will install the dependencies for the client and the server

Make sure `vsce` is installed globally. Use `npm i -g vsce`.

Additionally, this uses the [Prettier - Code Formatter](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) extension for maintaining a consistent syntax for all files. This is requried for development.

## Development

In order to develop using the extension you need to have the typescript compiled into javascript. From the main folder, execute the following:

```
npm run watch
```

This will watch for changes and recompile changes on teh fly. Once compiled, press `F5` in VSCodeto open a development session of VSCode that will have the extension up and running in. In the `Debug Console` you will be able to see console output from the server and any errors. 

**Note:** In the session that is automatically launched, you may have to select the "IDL Language Server" from the dropdown on that tab.


## Testing

There are a handful of unit tests for this extension. The unit tests for the `client` use Mocha and Chai, as this is required by VSCode (to the best of my knowledge). The language server uses AVA for unit tests.

Here are the general guidelines for writing tests:

- All unit tests should have the **.spec.ts** file extension, that is how they are discovered.

- Ideally, test files should live next to the file they are testing. I.e., the test for `index.ts` would be `index.spec.ts` in the same folder.

### Client Testing

Testing the actual extension for VSCode is pretty straightforward. For this, just:

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


## Package and Publish

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
    vsce publish
    ```

    This will repackage the extension which will re-run all of the tests as well.

    This will also prompt you for a personal access token for the `CT6502` group. If you are a member, paste your key and then it will automatically upload.

### Errors with Testing

If you are packaging the extension, make sure that you have VSCode closed before starting and that you are on a command prompt.

When testing, if you have VSCode hang with this message:

```
[main 2019-09-03T15:29:47.100Z] update#setState idle
[main 2019-09-03T15:30:17.103Z] update#setState checking for updates
[main 2019-09-03T15:30:17.485Z] update#setState idle
```

Then you need to launch the tests from VSCode first which seems to get it out of a bad state. Not quite sure what is going on there, but that is how we fix it.