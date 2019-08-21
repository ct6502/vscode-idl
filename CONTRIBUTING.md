# Contributing

This contains information about how to get set up for development with the tools.

## Setup

1. From the main folder, run `npm install`

2. Once the dependencies have been installed, which will be installed for this folder, the client, and the language server, you will need to recompile everything into single JS files.

    Do this with `npm run compile`

## Versioning

In `package.json`, at the top, bump the "version" key to the desired version number in quotes. Be sure to update `CHANGELOG.md` with a description of your changes.

## Testing

There are no unit tests for this extension, but if you are developing the functionality, then you should create a package from this extension and locally test to verify that the built extension works. To do this you:

1. From the main folder of this repository, run `vsce package`

    - If you don't have `vsce` installed as a global dependency, then run `npm install --global vsce` and try again

2. Verify in your extensions folder that there is **no** IDL extension already. If there is then the next step does not always work.

3. From the extensions tab in VSCode, you can click the ellipsis at the top left and selecct install from vsix files. Use that to install the extension that you just packaged up and make sure that it works.

4. Optional: send the package to all of your friends and have them try it out before publishing!

## Language Server Development (For when webpack is implemented)

1. Change directories into the `client` folder and run `npm run webpack`.

2. Press `F5` to start the extension debug session.

3. After changes are made to the code, in about 5 seconds the server will be recompiled, you can reload the extension debugger.

## VSCode Extension Client Development (For when webpack is implemented)

1. Change directories into the `client` folder and run `npm run webpack`.

2. Press `F5` to start the extension debug session.

3. After changes are made to the code, in about 5 seconds the server will be recompiled, you can reload the extension debugger.