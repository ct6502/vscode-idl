# VSCode IDL Internationalization

Unhappy with the complexity of all the solutions out there for internationalizing vscode extensions, decided to forge our own path.

The reason for this is because there was no easy way to guarantee or error check the keys from the JSON file. Even creating interfaces would not catch errors with the keys (maybe a typescript bug?), so I decided to work around this with the typescript approach which is to create an interface, variables, and then map the nested objects to the JSON format that VSCode expects. 

I wanted this primarily for ease of use (and error catching) which developing. This way, instead of needing to access a translation with `obj["some.nested.key]"` which could be an invalid key, it is now obj.some.nested.key which will be error proof! And then the testing is in typescript itself validating the keys being accessed.

An additional reason to go with this approach is ease of use. That is: if someone adds a new translation item, this will self-verify that all translation files are correct and have the right values. Much easier than dealing with checking JSON files and using schemas or some other method to double check JSON.

## Process

Basic process is this:

1. Before anything happens (development or production), this folder is built with `tsc -b`

2. Once built, `dist/build.js` is executed and generates all of the package.nls.json files

3. Extension is then compiled/packaged (whatever the developer chose to do), and it all works!

## Adding Translations

1. Add to translation.interface.ts in `src`

2. Update the files in `src/languages`

3. Update `client/src/translation.interface.ts` to reflect changes

4. Make sure to rebuild the language files