// NOT USED
// store the IDL directory locatioons to check when auto-starting IDL
export const IDL_TERMINAL_DIRS: { [key: string]: string[] } = {
  darwin: [
    '/Applications/harris/envi55/idl87/bin/bin.darwin.x86_64',
    '/Applications/harris/idl87/bin/bin.darwin.x86_64',
    '/Applications/harris/envi54/idl86/bin/bin.darwin.x86_64',
    '/Applications/harris/idl86/bin/bin.darwin.x86_64'
  ],
  linux: [
    '/usr/local/harris/envi55/idl87/bin/bin.linux.x86_64',
    '/usr/local/harris/idl87/bin/bin.linux.x86_64',
    '/usr/local/harris/envi54/idl86/bin/bin.linux.x86_64',
    '/usr/local/harris/idl86/bin/bin.linux.x86_64'
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
