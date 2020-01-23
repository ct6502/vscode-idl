// workaround for https://github.com/avajs/ava/issues/2151
// expected to be fixed in the next release
export {};

declare global {
  interface SymbolConstructor {
    readonly observable: symbol;
  }
}
