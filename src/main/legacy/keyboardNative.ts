/*
  Legacy CorePad reference (disabled)

  This file preserves notes from the previous CorePad template, which used
  `koffi` + `user32.dll` to simulate Windows keyboard input from Electron.

  It is intentionally not imported by the active main process because this app
  now focuses on media processing.

  Keep this file only as reference material in case native Windows automation
  is needed again in future iterations.
*/

export const keyboardNativeLegacyReference = {
  library: 'user32.dll',
  package: 'koffi',
  status: 'disabled'
} as const
