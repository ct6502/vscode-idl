import { ITranslation } from '../translation.interface';

export const enLanguage: ITranslation = {
  commands: {
    idl: {
      specifyIDLDirectory: 'IDL: Specify IDL Directory (User)',
      specifyIDLDirectoryWorkspace: 'IDL: Specify IDL Directory (Workspace)',
      fileABug: 'IDL: File a Bug',
      openIDLTerminal: 'IDL: Open an IDL Terminal Window',
      compileFileTerminal: 'IDL: Compile PRO File in Terminal',
      runFileTerminal: 'IDL: Run PRO File in Terminal',
      executeBatchFileTerminal: 'IDL: Execute Batch File in Terminal',
      resetIDLTerminal: 'IDL: Reset Session in Terminal',
      stopExecutionTerminal: 'IDL: Stop Execution in Terminal',
      continueExecutionTerminal: 'IDL: Continue Execution in Terminal',
      stepInTerminal: 'IDL: Step In in Terminal',
      stepOverTerminal: 'IDL: Step Over in Terminal',
      stepOutTerminal: 'IDL: Step Out in Terminal'
    },
    errors: {
      specifyIDLDirectory: 'Error while setting IDL directory (User)',
      specifyIDLDirectoryWorkspace: 'Error while setting IDL directory (Workspace)',
      fileABug: 'Unable to open GitHub URL',
      openIDLTerminal: 'Error while opening IDL terminal indow',
      compileFileTerminal: 'Error while compiling PRO file in terminal',
      runFileTerminal: 'Error while running PRO file in terminal',
      executeBatchFileTerminal: 'Error while executing batch file in terminal',
      resetIDLTerminal: 'Error while resetting session in terminal',
      stopExecutionTerminal: 'Error while stopping execution in terminal',
      continueExecutionTerminal: 'Error while continuing execution in terminal',
      stepInTerminal: 'Error while stepping in in terminal',
      stepOverTerminal: 'Error while stepping over in terminal',
      stepOutTerminal: 'Error while stepping out in terminal'
    }
  },
  configuration: {
    title: 'IDL: Interactive Data Language',
    idlDir: {
      description: "Specify the folder with IDL's executable (idl.exe or idl).",
      notFound: 'IDL directory not found or configured',
      configure: 'Configure',
      dontAsk: "Don't Ask Again"
    },
    dontAskForIDLDir: "Don't ask for IDL directory on extension startup if it is not set.",
    idlPath:
      "Specify additional directories to add to IDL's search path. Add a '+' before the folder to include subdirectories.",
    addWorkspaceFoldersToPath:
      "Specify whether to automatically include the workspace folders to IDL's search path.",
    appendOrPrependWorkspaceFolders:
      "If workspace folders are automatically added to IDL's search path, this indicates if they are added before (prepend) or after (append) the IDL Path setting.",
    verboseExtensionClient:
      'If set to true, the IDL extension will log verbose statements to the Extensions Output.',
    verboseServerClient:
      'If set to true, the IDL Language Server will log verbose statements to the Output view.',
    debugMode: 'If set to true, the extension will become very chatty for the purposes of debgging.'
  },
  debugger: {
    logs: {
      host: 'IDL: Extension Host',
      server: 'IDL: Language Server',
      viewLogs: 'View Logs'
    },
    idl: {
      pleaseStartTerminal: 'Pleast start a debug session of IDL',
      alreadyStartedTerminal: 'IDL has already been started in the terminal',
      noPROFile: 'No active PRO file in VSCode',
      noIDLDirFound: 'IDL directory not found or configured, cannot start IDL'
    }
  },
  idl: {
    tree: {
      name: 'Actions and Commands',
      selectionChangeError: 'Error while handling selection change in IDL tree',
      clickHandlerError: 'Error while handling IDL tree click event',
      parents: {
        commands: 'Additional Actions',
        debugging: 'Debugging',
        terminal: 'Terminal'
      },
      children: {
        fileBug: {
          name: 'File',
          description: 'a bug report for the extension'
        },
        openTerminal: {
          name: 'Open',
          description: 'IDL in a terminal window'
        },
        compileTerminal: {
          name: 'Compile',
          description: 'PRO file in terminal'
        },
        runTerminal: {
          name: 'Run',
          description: 'PRO file in terminal'
        },
        executeTerminal: {
          name: 'Execute',
          description: 'PRO file as batch file in terminal'
        },
        resetTerminal: {
          name: 'Reset',
          description: 'the IDL session in the terminal'
        },
        stopTerminal: {
          name: 'Stop',
          description: 'the IDL terminal process'
        },
        continueTerminal: {
          name: 'Continue',
          description: 'execution in terminal'
        },
        stepInTerminal: {
          name: 'Step Into',
          description: 'routine call in terminal'
        },
        stepOverTerminal: {
          name: 'Step Over',
          description: 'routine call in terminal'
        },
        stepOutTerminal: {
          name: 'Step Out',
          description: 'of routine call in terminal'
        }
      }
    }
  },
  logger: {
    defaultErrorMessage: 'The IDL extension had an error :( See output/debug console for details'
  },
  themes: {
    new: 'Novus IDL',
    retro: 'Retro IDL'
  }
};
