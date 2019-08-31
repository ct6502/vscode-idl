# Contributing

This contains information about how to get set up for development with the tools.

## Setup

From the main folder, run `npm install`, this will install the dependencies for the client and the server

Make sure `vsce` is installed globally. Use `npm i --g vsce`.

Additionally, this uses the [Prettier - Code Formatter](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) extension for maintaining a consistent syntax for all files. This is requried for development.

## Development

Start watching for changes with the TS files and have them get automatically compiled into JS with the following command from the root folder:

```
npm run watch
```

Once running, press `F5` to open a development session of VSCode that will have the extension up and running in.

## Package and Publish

**When publishing releases you should**:

1. Increment the version in `package.json` to the next desired version
2. Verify that you can pacakge everything, as noted below
3. Publish
4. Document changes in **CHANGELOG.md**
5. Push all changes to GitHub
6. Make release on GitHub
7. Attach `.vsix` file to GitHub release, you may need to repackage the extension to generate this file again

Here are the steps for how to package and publish.

1. To package, you need the `vsce` package installed globally with NPM

    ```
    npm i -g vsce
    vsce package
    ```

    The second command with execute the `vsce:prepublish` script in the main `package.json` file and then collect all of the items and make a `.vsix` file. You can then test this out locally and, once you verify it works correctly, then you can go to the next step.

2. Publishing changes

    ```
    vsce publish
    ```

    This will prompt you for a personal access token for the `CT6502` group. If you are a member, paste your key and then it will automatically upload.

## Development

This extension is comprised of a client (add-in for vscode) and a language server for IDL. In order to develop both, you can use typescript to auto-compile the `*.ts` files into `*.js`. To start developing, from the main package folder, you just need to:

```
npm run watch
Press F5 in vscode and a debug session will appear
```

## Versioning

In `package.json`, at the top, bump the "version" key to the desired version number in quotes. Be sure to update `CHANGELOG.md` with a description of your changes.

## Testing (Not Implemented)

There are no unit tests for this extension, but if you are developing the functionality, then you should create a package from this extension and locally test to verify that the built extension works. To do this you:

1. From the main folder of this repository, run `vsce package`

    - If you don't have `vsce` installed as a global dependency, then run `npm install --global vsce` and try again

2. Verify in your extensions folder that there is **no** IDL extension already. If there is then the next step does not always work.

3. From the extensions tab in VSCode, you can click the ellipsis at the top left and select install from vsix files. Use that to install the extension that you just packaged up and make sure that it works.

4. Optional: send the package to all of your friends and have them try it out before publishing!
