import { dialog, BrowserWindow, type OpenDialogOptions } from 'electron'

export async function selectVideoFile(ownerWindow: BrowserWindow | null): Promise<string | null> {
  const options: OpenDialogOptions = {
    title: 'Select Video File',
    properties: ['openFile'],
    filters: [
      {
        name: 'Supported Videos',
        extensions: ['mp4', 'mov', 'mkv', 'webm', 'avi', 'm4v']
      }
    ]
  }

  const result = ownerWindow
    ? await dialog.showOpenDialog(ownerWindow, options)
    : await dialog.showOpenDialog(options)

  if (result.canceled || result.filePaths.length === 0) {
    return null
  }

  return result.filePaths[0]
}

export async function selectOutputDirectory(
  ownerWindow: BrowserWindow | null
): Promise<string | null> {
  const options: OpenDialogOptions = {
    title: 'Select Output Directory',
    properties: ['openDirectory', 'createDirectory']
  }

  const result = ownerWindow
    ? await dialog.showOpenDialog(ownerWindow, options)
    : await dialog.showOpenDialog(options)

  if (result.canceled || result.filePaths.length === 0) {
    return null
  }

  return result.filePaths[0]
}
