import * as chalk from 'ava/lib/chalk';
chalk.set({ enabled: true });
import { Assertions } from 'ava';
import * as assert from 'ava/lib/assert';
import * as emoji from 'node-emoji';
import * as NYC from 'nyc';
import * as relative from 'relative';
import * as StackTracey from 'stacktracey';
import {
  DEFAULT_VULCAN_OPTIONS,
  DEFAULT_VULCAN_STATS,
  IVulcanFileStats,
  IVulcanOptions,
  IVulcanRunner,
  IVulcanStackItem,
  IVulcanStats,
  IVulcanTestOptions,
  VULCAN_CONSOLE_COLOR_LOOKUP,
  VulcanConsoleColor,
  VulcanRunner,
  VulcanSuiteRunner,
  VulcanSuiteRunnerSync,
  VulcanTestRunner,
  VulcanTestRunnerSync,
  VulkanStack
} from './vulcan.interface';

export class Vulcan {
  readonly options: IVulcanOptions;
  file: string;
  relativeFile: string;
  readonly stats: IVulcanStats = { ...DEFAULT_VULCAN_STATS };
  readonly fileStats: IVulcanFileStats = {};
  passed = true;
  runningTest = false;
  private fileStart: number;
  private nyc: any;
  private stack: IVulcanStackItem[] = [];

  // make our object
  constructor(options: IVulcanOptions) {
    this.options = { ...DEFAULT_VULCAN_OPTIONS, ...options };
  }

  // run our tests
  async run(): Promise<boolean> {
    this.log(`Running Vulcan tests for ${this.options.files.length} file(s)`, 'cyan');
    return new Promise(async (resolve, reject) => {
      // start listening to code coverage
      await this.startCoverage();

      // process each file
      for (let i = 0; i < this.options.files.length; i++) {
        this.file = this.options.files[i];
        this.relativeFile = relative(__dirname, this.file);
        this.log(`    Processing "${relative(this.options.cwd, this.file)}"`, 'cyan');

        // initialize stats and set the file we are processing
        this.initStats();

        // run the tests
        try {
          // load the module
          // const runner: VulcanRunner = require('./' + relative(__dirname, file));
          const runner: IVulcanRunner = require(this.relativeFile);

          // attempt to run the tests
          await runner.run(this);

          // finish stats
          this.finishStats();
        } catch (err) {
          // any errors we autoamtically reject
          // finish stats since we failed
          this.finishStats();

          // print for user and return
          // tslint:disable-next-line: no-console
          console.log(err);
          reject(err);
          return;
        }

        // clean up
        this.file = undefined;
        this.relativeFile = undefined;
      }

      // stop listening to code coverage
      await this.stopCoverage();

      // alert user
      if (this.passed) {
        this.log(
          `Passed ${this.stats.tests} test(s) for ${this.options.files.length} file(s)`,
          'green'
        );
      } else {
        this.log(`Failed ${this.stats.failed} test(s) out of ${this.stats.tests}`, 'red');
      }

      // resolve
      resolve(this.passed);
    });
  }

  async suite(title: string, runner: VulcanSuiteRunner) {
    try {
      this.log(`    ${title}`, 'blue');
      await runner();
    } catch (err) {
      throw err;
    }
  }

  suiteSync(title: string, runner: VulcanSuiteRunnerSync) {
    try {
      this.log(`    ${title}`, 'blue');
      runner();
    } catch (err) {
      throw err;
    }
  }

  async test(titleOrOpts: string | IVulcanTestOptions, runner: VulcanTestRunner) {
    // handle our different inputs
    const options: IVulcanTestOptions =
      typeof titleOrOpts === 'object' ? titleOrOpts : { title: titleOrOpts };

    // get the stack
    this.stack = new StackTracey().slice(6);

    // get the start time
    const startTime: any = new Date();

    // init flag for passing
    let flag = false;
    let first = true;
    let diff = '';

    // create our asserter
    const t = this.getAsserter(
      () => {
        if (!flag && first) {
          flag = true;
          first = false;
        }
      },
      err => {
        flag = false;
        first = false;
        if (err.values.length > 0) {
          diff = err.values[0].formatted;
        }
        if (this.options.failFast) {
          this.failFast();
        }
      }
    );

    // run our test
    this.runningTest = true;
    try {
      await Promise.race(this.getPromises(t, options, runner));
    } catch (err) {
      if (err === 'Vulcan test exceeded running time') {
        options.title += ' - Exceeded running time';
        flag = false;
      } else {
        throw err;
      }
    }
    this.runningTest = false;
    this.processTest(options.title, flag, first, (new Date() as any) - startTime, diff);

    // check if we need to fail fast
    if (!flag && this.options.failFast) {
      this.failFast();
    }
  }

  getAsserter(pass: () => void, fail: (err) => void): Assertions {
    return new assert.Assertions({
      // called anytime the test passes
      pass: pass,
      pending: () => {
        // for throwsAsync and notThrowsAsync
        // dont implement because we have nothing to do since everything
        // should be async anyways
      },
      fail: fail,
      skip: () => {
        // do nothing
      },
      compareWithSnapshot: () => {
        // do nothing
      }
    });
  }

  testSync(title: string, runner: VulcanTestRunnerSync) {
    // get the stack
    this.stack = new StackTracey().slice(6);

    // get the start time
    const startTime: any = new Date();

    // init flag for passing
    let flag = false;
    let first = true;
    let diff = '';

    // create our asserter
    const t = this.getAsserter(
      () => {
        if (!flag && first) {
          flag = true;
          first = false;
        }
      },
      err => {
        flag = false;
        first = false;
        if (err.values.length > 0) {
          diff = err.values[0].formatted;
        }
        if (this.options.failFast) {
          this.failFast();
        }
      }
    );

    // run our test
    this.runningTest = true;
    try {
      runner(t);
    } catch (err) {
      throw err;
    }
    this.runningTest = false;
    this.processTest(title, flag, first, (new Date() as any) - startTime, diff);
  }

  async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // tslint:disable-next-line: prefer-function-over-method
  private failFast() {
    throw new Error('Failed test and the option for failing fast was set, see above for details');
  }

  // tslint:disable-next-line: prefer-function-over-method
  private getPromises(t: Assertions, options: IVulcanTestOptions, runner: VulcanTestRunner) {
    if ('timeout' in options) {
      return [
        new Promise<boolean>((resolve, reject) => {
          setTimeout(() => {
            reject('Vulcan test exceeded running time');
          }, options.timeout);
        }),
        runner(t)
      ];
    }

    return [runner(t)];
  }

  private processTest(
    title: string,
    flag: boolean,
    first: boolean,
    duration: number,
    diff: string
  ) {
    // update the overall and file stats
    this.updateStats(flag);

    // update properties
    if (this.passed) {
      this.passed = flag;
    }

    // check if we failed becuase we didnt pass any tests
    if (first && !flag) {
      // tslint:disable-next-line: no-parameter-reassignment
      title += ' - Failed because no tests were executed';
    }

    // alert
    if (flag) {
      this.log(`        ${title} (${Math.floor(duration)} ms)`, 'green');
      if (this.options.verbose) {
        this.log(`            ${this.stack[0].beforeParse}`, 'red');
      }
    } else {
      this.log(`        ${title} (${Math.floor(duration)} ms)`, 'red');
      this.log(`            ${this.stack[0].beforeParse}`, 'red');
      if (diff) {
        this.log('Difference:\n');
        // tslint:disable-next-line: no-console
        console.log(diff + '\n');
      }
    }
  }

  private updateStats(passed: boolean) {
    // update for overall
    this.stats.tests += 1;
    this.stats.passed += passed ? 1 : 0;
    this.stats.failed += !passed ? 1 : 0;

    // update for file
    if (this.file) {
      this.fileStats[this.file].tests += 1;
      this.fileStats[this.file].passed += passed ? 1 : 0;
      this.fileStats[this.file].failed += !passed ? 1 : 0;
    }
  }

  private initStats() {
    this.fileStart = time();
    this.fileStats[this.file] = {
      tests: 0,
      passed: 0,
      failed: 0,
      time: 0
    };
  }

  // tslint:disable-next-line: prefer-function-over-method
  private log(item: string, color?: VulcanConsoleColor, bold = true) {
    let style = '';
    if (color) {
      style = VULCAN_CONSOLE_COLOR_LOOKUP[color];
    }
    if (bold) {
      if (style) {
        style += '\x1b[1m';
      } else {
        style = '1m';
      }
    }
    if (color) {
      // tslint:disable-next-line: no-console
      console.log(`\x1b[${style}%s\x1b[0m`, emoji.emojify(item));
    } else {
      // tslint:disable-next-line: no-console
      console.log(emoji.emojify(item));
    }
  }

  private finishStats() {
    if (!this.file) {
      return;
    }

    // set time
    this.fileStats[this.file].time = time() - this.fileStart;
  }

  // start the code coveraging
  private async startCoverage() {
    this.nyc = new NYC({
      cwd: this.options.cwd, // in debugging sessions, the cwd seems to be unset
      reporter: ['text', 'html'],
      instrument: true,
      hookRequire: true,
      hookRunInContext: true,
      hookRunInThisContext: true,
      showProcessTree: false,
      exclude: '**/.vscode-test/**'
    });
    await this.nyc.createTempDirectory(); // create nyc' temp directory
    this.nyc.wrap(); // hook into require() calls, etc.
  }

  // stop the code coveraging and make the report
  private async stopCoverage() {
    this.nyc.writeCoverageFile();
    await this.nyc.report(); // write out the reports!
  }
}

function time(): number {
  return process.hrtime()[1] / 1000000;
}
