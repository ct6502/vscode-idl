import { idlTranslation } from '../extension';

// get the translations for our tree children
const children = idlTranslation.idl.tree.children;

// constants to store the names and information for child objects
interface IChild {
  name: string;
  descripion: string;
  icon: string;
  commandName: string;
}

// specify the children for the command parent in the tree view
export const TERMINAL_BUTTONS: IChild[] = [
  {
    name: children.openTerminal.name,
    descripion: children.openTerminal.description,
    icon: 'open-new.svg',
    commandName: 'idl.openIDLTerminal'
  },
  {
    name: children.compileTerminal.name,
    descripion: children.compileTerminal.description,
    icon: 'settings.svg',
    commandName: 'idl.compileFileTerminal'
  },
  {
    name: children.runTerminal.name,
    descripion: children.runTerminal.description,
    icon: 'file-play.svg',
    commandName: 'idl.runFileTerminal'
  },
  {
    name: children.executeTerminal.name,
    descripion: children.executeTerminal.description,
    icon: 'file-batch.svg',
    commandName: 'idl.executeBatchFileTerminal'
  },
  {
    name: children.resetTerminal.name,
    descripion: children.resetTerminal.description,
    icon: 'renew.svg',
    commandName: 'idl.resetIDLTerminal'
  },
  {
    name: children.stopTerminal.name,
    descripion: children.stopTerminal.description,
    icon: 'stop.svg',
    commandName: 'idl.stopExecutionTerminal'
  },
  {
    name: children.continueTerminal.name,
    descripion: children.continueTerminal.description,
    icon: 'play.svg',
    commandName: 'idl.continueExecutionTerminal'
  },
  {
    name: children.stepInTerminal.name,
    descripion: children.stepInTerminal.description,
    icon: 'arrow-down.svg',
    commandName: 'idl.stepInTerminal'
  },
  {
    name: children.stepOverTerminal.name,
    descripion: children.stepOverTerminal.description,
    icon: 'arrow-over.svg',
    commandName: 'idl.stepOverTerminal'
  },
  {
    name: children.stepOutTerminal.name,
    descripion: children.stepOutTerminal.description,
    icon: 'arrow-up.svg',
    commandName: 'idl.stepOutTerminal'
  }
];

// specify the children for the command parent in the tree view
export const COMMAND_BUTTONS: IChild[] = [
  {
    name: children.fileBug.name,
    descripion: children.fileBug.description,
    icon: 'bug.svg',
    commandName: 'idl.fileABug'
  }
];
