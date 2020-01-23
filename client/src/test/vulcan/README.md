# Vulcan

Simple. Easy. Write your tests, your way. Built to be opinionated and process tests async and in order, primarily for VSCode extension development.

Vulcan is a test framework that:

- Was written to be used with vscode extensions testing

- Written exclusively for typescript

- Runs all tests in the same process (access to variables and whatever you waant) which is mostly for VSCode

- Doesn't use the built in literals with `it`, `describe`, or `suite` and, instead, has a simple API.

- Built in code coverage sing `nyc.`

## Why

I *hate* mocha. Let me make that clear: I *really*, *really*, *hate* mocha. Nightmare to get set up with dependencies and libraries and idiosyncrasies like not being allowed to use arrow functions. I spent less time writing this library than tryng to figure out how mocha works, getting async to run, and troubleshooting mocha tests not running.

Inspired by [ava](https://github.com/avajs/ava) because of how simple it is. I like simple.


## How To

Considering this is a programmatic test library, you'll need to do a little setup to get things working. There are three parts:

1. Test runner which discovers files and runs the tests.

2. Test scripts (`.spec.ts`) that export an async function to run the tests.

3. Writing the tests in the test scripts.

### Test Runner

```typescript
import * as glob from 'glob';
import * as path from 'path';
import { Vulcan } from './vulcan/vulcan.class';

// this routine is called when we execute tests from within vscode
// it discovers all of the tests files and runs them with annpoying mocha
export async function run(): Promise<number> {
  const testsRoot = path.resolve(__dirname, '..');

  return new Promise((resolve, reject) => {
    glob('**/**.spec.js', { cwd: testsRoot }, async (err, files) => {
      if (err) {
        reject(err);
        return;
      }

      // get the working dirctory for the extension
      const cwd = path.join(__dirname, '..', '..', '..'); // in debugging sessions, the cwd seems to be unset

      // get fully-qualified paths
      const mapped = files.map(file => path.resolve(testsRoot, file));

      // forge our code with vulcan
      const v = new Vulcan({ cwd: cwd, files: mapped });

      try {
        const passed = await v.run();
        if (!passed) {
          reject(new Error(`Failed ${v.stats.failed} test(s)`));
        }
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  });
}
```

### Test Script

Define a fuction that is exported. Here are two ways and here are the snippets for both:

```typescript
// define functions with arrows and as a const, if that is your thing
import { VulcanRunner } from './test/vulcan/vulcan.interface';
export const run: VulcanRunner = async v => {
  return;
};

// define a function the good od fashioned way
import { Vulcan } from './test/vulcan/vulcan.class';
export async function run(v: Vulcan): Promise<void> {
  return;
}
```

### Write Tests as Async Suites and Async Tests

The assertions for the tests use Ava's assertions which you can find more on [here](https://github.com/avajs/ava/blob/master/docs/03-assertions.md#built-in-assertions). Not all have been officially supported. You might have issues with assertion planning or snapshots.

It is assumed that all tests, unless they pass an assertion, fail. Meaning a test without any assertions will fail as nothing is actually tested. If needed, you can always just call `t.pass()` to pass the test.

There are two ways to write your tests:

1. Using all of the `sync` methods

2. Using async, which can also be paired with sync

    - Pro tip: the async methods allow for other options like timeouts to limit the amount of time a test can take to run

For the sync methods, make sure you always use async and await to keep the execution synchronous if that is what you need.

```typescript
export const run: VulcanRunner = async v => {
  // tests can either be all sync, like below
  v.suiteSync('Some suite', () => {
    v.testSync('Some test', () => {
      // some thing
      const a = 5;
      return a === 5;
    });

    v.testSync('Some async test', () => {
      // some thing
      const a = 5;
      return a < 4;
    });
  });

  // or, if you start with the default `sync` and `test` methods, then
  // you can add in sync tests
  // make sure to properly place your async and await statements so that
  // they execute in the proper order. tslint is great to help make sure
  // that you have no improperly handled promises as well (floating)
  await v.suite('Second suite', async () => {
    v.testSync('Some other test', () => {
      // some thing
      const a = 5;
      return a === 5;
    });

    await v.test('Some other async test', async () => {
      // some thing
      const a = 5;
      return a < 4;
    });

    // limit the amount of time the test can run - will fail
    await v.test({ title: 'Some other async test', timeout: 1300 }, async () => {
      // run something that takes a while
      await new Promise(resolve => {
        setTimeout(() => {
          resolve();
        }, 1333);
      });

      // some thing
      const a = 5;
      return a > 4;
    });

  return;
};
```
