export type IDLActionType =
  | 'Commands'
  | 'Open'
  | 'Compile'
  | 'Run'
  | 'Stop'
  | 'Continue'
  | 'Step In'
  | 'Step Over'
  | 'Step Out'
  | 'Reset';

export interface IDLCommandAction {
  label: IDLActionType;
}
