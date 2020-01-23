export type IDLDir = string[];

export interface IDLDirs {
  darwin: string[];
  linux: string[];
  win32: string[];
  aix: string[];
  freebsd: string[];
  openbsd: string[];
  sunos: string[];
}

// store the IDL directory locatioons to check when auto-starting IDL
export const IDL_DIRS: IDLDirs = {
  darwin: [
    '/Applications/harris/envi55/idl87/bin',
    '/Applications/harris/idl87/bin',
    '/Applications/harris/envi54/idl86/bin',
    '/Applications/harris/idl86/bin'
  ],
  linux: [
    '/usr/local/harris/envi55/idl87/bin',
    '/usr/local/harris/idl87/bin',
    '/usr/local/harris/envi54/idl86/bin',
    '/usr/local/harris/idl86/bin'
  ],
  win32: [
    'C:\\Program Files\\Harris\\ENVI55\\IDL87\\bin\\bin.x86_64',
    'C:\\Program Files\\Harris\\IDL87\\bin\\bin.x86_64',
    'C:\\Program Files\\Harris\\ENVI54\\IDL86\\bin\\bin.x86_64',
    'C:\\Program Files\\Harris\\IDL86\\bin\\bin.x86_64'
  ],

  // other OS values, just in case we come across them
  aix: [],
  freebsd: [],
  openbsd: [],
  sunos: []
};
