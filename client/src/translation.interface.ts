export interface ITranslation {
  commands: {
    idl: {
      specifyIDLDirectory: string;
      specifyIDLDirectoryWorkspace: string;
      fileABug: string;
      openIDLTerminal: string;
      compileFileTerminal: string;
      runFileTerminal: string;
      executeBatchFileTerminal: string;
      resetIDLTerminal: string;
      stopExecutionTerminal: string;
      continueExecutionTerminal: string;
      stepInTerminal: string;
      stepOverTerminal: string;
      stepOutTerminal: string;
    };
    errors: {
      specifyIDLDirectory: string;
      specifyIDLDirectoryWorkspace: string;
      fileABug: string;
      openIDLTerminal: string;
      compileFileTerminal: string;
      runFileTerminal: string;
      executeBatchFileTerminal: string;
      resetIDLTerminal: string;
      stopExecutionTerminal: string;
      continueExecutionTerminal: string;
      stepInTerminal: string;
      stepOverTerminal: string;
      stepOutTerminal: string;
    };
  };
  configuration: {
    title: string;
    idlDir: {
      description: string;
      notFound: string;
      configure: string;
      dontAsk: string;
    };
    dontAskForIDLDir: string;
    idlPath: string;
    addWorkspaceFoldersToPath: string;
    appendOrPrependWorkspaceFolders: string;
    verboseExtensionClient: string;
    verboseServerClient: string;
    debugMode: string;
  };
  debugger: {
    logs: {
      host: string;
      server: string;
      viewLogs: string;
    };
    idl: {
      pleaseStartTerminal: string;
      alreadyStartedTerminal: string;
      noPROFile: string;
      noIDLDirFound: string;
    };
  };
  idl: {
    tree: {
      name: string;
      selectionChangeError: string;
      clickHandlerError: string;
      parents: {
        commands: string;
        debugging: string;
        terminal: string;
      };
      children: {
        fileBug: {
          name: string;
          description: string;
        };
        openTerminal: {
          name: string;
          description: string;
        };
        compileTerminal: {
          name: string;
          description: string;
        };
        runTerminal: {
          name: string;
          description: string;
        };
        executeTerminal: {
          name: string;
          description: string;
        };
        resetTerminal: {
          name: string;
          description: string;
        };
        stopTerminal: {
          name: string;
          description: string;
        };
        continueTerminal: {
          name: string;
          description: string;
        };
        stepInTerminal: {
          name: string;
          description: string;
        };
        stepOverTerminal: {
          name: string;
          description: string;
        };
        stepOutTerminal: {
          name: string;
          description: string;
        };
      };
    };
  };
  logger: {
    defaultErrorMessage: string;
  };
  themes: {
    new: string;
    retro: string;
  };
}
