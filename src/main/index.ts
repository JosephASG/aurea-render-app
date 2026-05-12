import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { mkdir, readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { registerMediaIpcHandlers } from './ipc/media.ipc'
import { registerTranscriptionIpcHandlers } from './ipc/transcription.ipc'
import { defaultAppConfig, normalizeAppConfig, type AppConfig } from '../shared/app-config'

let mainWindow: BrowserWindow | null = null

const configFileName = 'core-split-config.json'
const hasSingleInstanceLock = app.requestSingleInstanceLock()

if (!hasSingleInstanceLock) {
  app.quit()
}

function getConfigPath(): string {
  return join(app.getPath('userData'), configFileName)
}

async function readAppConfig(): Promise<AppConfig> {
  try {
    const rawConfig = await readFile(getConfigPath(), 'utf-8')
    return normalizeAppConfig(JSON.parse(rawConfig))
  } catch {
    return defaultAppConfig
  }
}

async function writeAppConfig(config: AppConfig): Promise<AppConfig> {
  await mkdir(app.getPath('userData'), { recursive: true })
  await writeFile(getConfigPath(), `${JSON.stringify(config, null, 2)}\n`, 'utf-8')
  return config
}

function registerConfigIpcHandlers(): void {
  ipcMain.handle('config:get', async () => readAppConfig())
  ipcMain.handle('config:set', async (_, nextConfig: Partial<AppConfig>) => {
    const currentConfig = await readAppConfig()
    const savedConfig = await writeAppConfig(
      normalizeAppConfig({ ...currentConfig, ...nextConfig })
    )

    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('config:updated', savedConfig)
    })

    return savedConfig
  })
}

function createMainWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1040,
    height: 740,
    minWidth: 860,
    minHeight: 620,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}#/`)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'), { hash: '/' })
  }
}

function focusMainWindow(): void {
  if (!mainWindow) {
    createMainWindow()
    return
  }

  if (mainWindow.isMinimized()) {
    mainWindow.restore()
  }

  if (!mainWindow.isVisible()) {
    mainWindow.show()
  }

  mainWindow.focus()
}

if (hasSingleInstanceLock) {
  app.on('second-instance', () => {
    focusMainWindow()
  })

  app.whenReady().then(() => {
    electronApp.setAppUserModelId('com.sacredlabs.mediaforge')

    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window)
    })

    registerMediaIpcHandlers()
    registerTranscriptionIpcHandlers()
    registerConfigIpcHandlers()
    createMainWindow()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow()
      }
    })
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })
}
