// regex and line identifiers
export const REGEX_LINE_START = /^\r*\n/;
export const REGEX_LINE_END = /\r*\n$/;
export const REXEG_NEW_LINE = /\r*\n/gm;
export const REGEX_EMPTY_LINE = /^\n\r?$|^\r?\n$/;
export const REGEX_IDL_PROMPT = /(?<!")\n* *IDL> *|(?<!")\n* *ENVI> */;
export const REGEX_STOP_DETECTION = /(% Breakpoint at|% Stepped to|% Stop encountered|% Execution halted at) *: *([a-z_][a-z_0-9$:]*|[a-z_][a-z_0-9$:]* *[a-z_][a-z_0-9$:]*|\$main\$) *([0-9]+) *(.*)/gim;
export const REGEX_IDL_RESTART = /^.f|^.res/gim;
export const REGEX_IDL_RETALL = /^retall|^return/gim;
export const REGEX_CLEAN_HTML_HREF = /(?<!base )href="/gim;
export const REGEX_CLEAN_HTML_SRC = /src="/gim;
export const REGEX_HIDE_VSCODE_COMPILE = /\n?% Compiled module: VSCODE_[_a-z0-9$]*\.\n?/gim;
export const REGEX_BREAKPOINT_INFO = /^\s*([0-9]+)\s*([0-9]+)/gim;
export const REGEX_BREAKPOINT_FILE = /[a-z]:\\[\\\s|*\s]?.*$|\/([a-z0-9-_+.]+\/)*([a-z0-9-_+.]+)$/gim;
