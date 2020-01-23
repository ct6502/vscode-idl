import { Assertions } from 'ava';
import { Vulcan } from './vulcan.class';

export interface IVulcanOptions {
  cwd: string;
  files: string[];
  failFast?: boolean;
  verbose?: boolean;
}

export const DEFAULT_VULCAN_OPTIONS: IVulcanOptions = {
  cwd: '',
  files: [],
  failFast: false,
  verbose: false
};

export interface IVulcanRunner {
  run: VulcanRunner;
}

// types for functions
export type VulcanRunner = (vulcan: Vulcan) => Promise<void>;
export type VulcanTestRunner = (t: Assertions) => Promise<void>;
export type VulcanTestRunnerSync = (t: Assertions) => void;
export type VulcanSuiteRunner = () => Promise<void>;
export type VulcanSuiteRunnerSync = () => void;

export interface IVulcanTestOptions {
  title: string;
  timeout?: number;
}

export interface IVulcanStatsItem {
  tests: number;
  passed: number;
  failed: number;
  time: number;
}

export interface IVulcanFileStats {
  [key: string]: IVulcanStatsItem;
}

export interface IVulcanStats {
  tests: number;
  passed: number;
  failed: number;
}

export const DEFAULT_VULCAN_STATS: IVulcanStats = {
  tests: 0,
  passed: 0,
  failed: 0
};

// https://www.npmjs.com/package/stacktracey
export interface IVulcanStackItem {
  beforeParse: string; //  <original text>,
  callee: string; //       <function name>,
  calleeShort: string; // <shortened function name>,
  file: string; //         <full path to file>,       // e.g. /Users/john/my_project/node_modules/foobar/main.js
  fileRelative: string; // <relative path to file>,   // e.g. node_modules/foobar/main.js
  fileShort: string; //    <short path to file>,      // e.g. foobar/main.js
  fileName: string; //     <file name>,               // e.g. main.js
  line: number; //         <line number>,             // starts from 1
  column: number; //       <column number>,           // starts from 1

  index: boolean; //         /* true if occured in HTML file at index page    */,
  native: boolean; //        /* true if occured in native browser code        */,
  thirdParty: boolean; //    /* true if occured in library code               */,
  hide: boolean; //          /* true if marked as hidden by "// @hide" tag    */,
  syntaxError: boolean; //    /* true if generated from a SyntaxError instance */
}

export type VulkanStack = IVulcanStackItem[];

export const VULCAN_CONSOLE_COLOR_LOOKUP = {
  black: '30m',
  red: '31m',
  green: '32m',
  yellow: '33m',
  blue: '34m',
  magenta: '35m',
  cyan: '36m',
  white: '37m'
};

export type VulcanConsoleColor =
  | 'black'
  | 'red'
  | 'green'
  | 'yellow'
  | 'blue'
  | 'magenta'
  | 'cyan'
  | 'white';
