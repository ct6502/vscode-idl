import { idlTranslation } from '../extension';
import { Logger } from './logger.class';

// constants for the log names that we can import and use anywhere
export const IDL_LOG = 'idl';
export const IDL_COMMAND_LOG = 'idl-command';
export const IDL_TREE_LOG = 'idl-tree';
export const IDL_TREE_CLICK_HANDLER_LOG = 'idl-tree-click-handler';
export const IDL_DEBUG_LOG = 'idl-debug';
export const IDL_DEBUG_ADAPTER_LOG = 'idl-debug-adapter';
export const IDL_DEBUG_CONFIGURATION_LOG = 'idl-debug-configuration';
export const IDL_WEB_VIEW_LOG = 'idl-webview';
export const ALL_IDL_LOGS = [
  IDL_LOG,
  IDL_COMMAND_LOG,
  IDL_TREE_LOG,
  IDL_TREE_CLICK_HANDLER_LOG,
  IDL_DEBUG_LOG,
  IDL_DEBUG_ADAPTER_LOG,
  IDL_DEBUG_CONFIGURATION_LOG,
  IDL_WEB_VIEW_LOG
];

// simple type for what types we are allowed to print
export type LogType = 'debug' | 'info' | 'log' | 'warn' | 'error';

export interface ILogs {
  [key: string]: Logger;
}

export interface ILogOptions {
  level?: LogType;
  content: any | any[];
  log?: string;
  alert?: boolean;
  alertMessage?: string;
  verbose?: boolean;
  debug?: boolean;
}

export const DEFAULT_LOGGER_OPTIONS: ILogOptions = {
  level: 'info',
  content: undefined,
  log: IDL_LOG,
  alert: false,
  alertMessage: idlTranslation.logger.defaultErrorMessage,
  verbose: false,
  debug: false
};
