import * as fs from 'fs';
import * as jsonFormat from 'json-format';
import * as minilog from 'minilog';
import * as vscode from 'vscode';
import { idlConfiguration, idlTranslation } from '../extension';
import { DEFAULT_IDL_CONFIGURATION } from '../extension.interface';
import { cleanPath } from '../utils/clean-path';
import {
  ALL_IDL_LOGS,
  DEFAULT_LOGGER_OPTIONS,
  ILogOptions,
  ILogs,
  LogType
} from './logger.interface';

const format = {
  type: 'space',
  size: 2
};

// enable logging
minilog.enable();

// channel for logging
const channel = vscode.window.createOutputChannel(idlTranslation.debugger.logs.host);
if (process.env.VSCODE_IDL_DEBUGGING === 'true') {
  channel.appendLine('Debug mode detected for IDL extension, check debug console of host process');
}

// check if we have a log file
const logToFile = process.env.VSCODE_IDL_LOG_TO_FILE;
let file: fs.WriteStream;
const logFile = process.env.VSCODE_IDL_LOGFILE;
const okFileLog = logToFile === 'true' && logFile !== '';
if (okFileLog) {
  file = fs.createWriteStream(cleanPath(logFile), { flags: 'w' });
}

// simple logger that only logs out to the console, wraps minilog a bit.
export class Logger {
  name: string;
  private logger: Minilog; // save the minilog reference with the custom namespace
  private parent: Log;

  constructor(logName = 'console', parent: Log) {
    this.name = logName;
    this.logger = minilog(logName.toLowerCase());
    this.parent = parent;
  }

  // log basic information to the console
  log(data: any | any[], type: LogType = 'info', verbose = false, debug = false) {
    // check if we are verbose and can print
    let okPrint = true;
    switch (true) {
      case debug:
        okPrint = this.parent.debug;
        break;
      case verbose:
        okPrint = this.parent.verbose || this.parent.debug;
        break;
      default:
      // do nothing
    }
    if (!okPrint) {
      return;
    }

    // check how to progress
    switch (true) {
      case okFileLog:
        file.write(this.fileLogItem(data, type) + '\n');
        break;
      case process.env.VSCODE_IDL_DEBUGGING !== 'true':
        channel.appendLine(this.fileLogItem(data, type));
        break;
      case Array.isArray(data):
        data.forEach((item: any) => {
          this.logItem(item, type);
        });
        break;
      default:
        this.logItem(data, type);
        break;
    }
  }

  private fileLogItem(items: any | any[], type: LogType = 'info') {
    let strings = `${this.name} ${type} `;
    if (Array.isArray(items)) {
      items.forEach((item, idx) => {
        strings += stringify(item) + (idx === items.length - 1 ? '' : '\n');
      });
    } else {
      strings += stringify(items);
    }
    return strings;
  }

  // simple wrapper that logs single items (to make it easier for logging)
  private logItem(item: any, type: LogType = 'info') {
    switch (type) {
      case 'debug':
        this.logger.debug(item);
        break;
      case 'info':
        this.logger.info(item);
        break;
      case 'log':
        this.logger.log(item);
        break;
      case 'warn':
        this.logger.warn(item);
        break;
      case 'error':
        this.logger.error(item);
        break;
      default:
      // do nothing
    }
  }
}

// parent class that wraps logging with a bunch of loggers
export class Log {
  verbose = DEFAULT_IDL_CONFIGURATION.verboseExtensionClient;
  debug = DEFAULT_IDL_CONFIGURATION.debugMode;
  private logs: ILogs = {};

  // create our logs
  constructor() {
    ALL_IDL_LOGS.forEach(logName => {
      this.createLog(logName);
    });
  }

  updateConfiguration() {
    this.verbose = idlConfiguration.verboseExtensionClient;
    this.debug = idlConfiguration.debugMode;
  }

  createLog(logName: string) {
    // get the lower case name
    const useName = logName.toLowerCase();

    // check if we are already using this log or not
    const found = useName in this.logs;
    if (!found) {
      this.logs[useName] = new Logger(logName, this);
    }
  }

  log(options: ILogOptions) {
    // merge our options with the defaults
    const useOptions = { ...DEFAULT_LOGGER_OPTIONS, ...options };

    // get the lower case name
    const useName = useOptions.log.toLowerCase();

    // check how to proceed
    switch (true) {
      case useName in this.logs:
        this.logs[useName].log(
          useOptions.content,
          useOptions.level,
          options.verbose,
          options.debug
        );
        break;
      default:
        this.logs.idl.log(`Unknown log "${useName}`, 'error'); // alert user
        this.logs.idl.log(useOptions.content, useOptions.level, options.verbose, options.debug);
        break;
    }

    // check if we need to alert the user
    if (useOptions.alert) {
      switch (useOptions.level) {
        case 'error':
          vscode.window
            .showErrorMessage(useOptions.alertMessage, idlTranslation.debugger.logs.viewLogs)
            .then(res => {
              // handle the result
              switch (true) {
                // do nothing
                case res === undefined:
                  break;
                case res === idlTranslation.debugger.logs.viewLogs:
                  channel.show();
                  break;
                // do nothing
                default:
              }
            });
          break;
        case 'warn':
          vscode.window.showWarningMessage(useOptions.alertMessage);
          break;
        case 'info':
          vscode.window.showInformationMessage(useOptions.alertMessage);
          break;
        default:
          break;
      }
    }
  }
}

function stringify(item: any): string {
  switch (true) {
    case typeof item === 'object':
      return jsonFormat(item, format);
    case Array.isArray(item):
      return jsonFormat(item, format);
    default:
      return item;
  }
}
