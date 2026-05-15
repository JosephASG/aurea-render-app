import { contextBridge, ipcRenderer } from 'electron'
import type {
  CreateMediaJobInput,
  AudioPreviewInfo,
  MediaJob,
  MediaJobError,
  MediaJobProgress,
  MediaJobResult,
  VideoInfo
} from '../shared/media'
import type { AppConfig } from '../shared/app-config'
import type { TranscriptionRequest, TranscriptionResponse } from '../shared/transcription'
import type { SavedTranscription, SaveTranscriptionInput } from '../shared/transcription-library'

const channels = {
  selectVideo: 'media:select-video',
  selectOutputDirectory: 'media:select-output-directory',
  getDefaultOutputDirectory: 'media:get-default-output-directory',
  openOutputLocation: 'media:open-output-location',
  getVideoInfo: 'media:get-video-info',
  getAudioPreviewInfo: 'media:get-audio-preview-info',
  readAudioPreviewFile: 'media:read-audio-preview-file',
  createJob: 'media:create-job',
  cancelJob: 'media:cancel-job',
  jobProgress: 'media:job-progress',
  jobCompleted: 'media:job-completed',
  jobFailed: 'media:job-failed'
} as const

const configChannels = {
  get: 'config:get',
  set: 'config:set',
  updated: 'config:updated'
} as const

const transcriptionChannels = {
  transcribeAudio: 'transcription:transcribe-audio'
} as const

const transcriptionLibraryChannels = {
  list: 'transcription-library:list',
  save: 'transcription-library:save',
  openLocation: 'transcription-library:open-location'
} as const

const windowChannels = {
  minimize: 'window:minimize',
  toggleMaximize: 'window:toggle-maximize',
  close: 'window:close',
  isMaximized: 'window:is-maximized',
  maximizedChanged: 'window:maximized-changed'
} as const

const mediaApi = {
  selectVideo: (): Promise<string | null> => ipcRenderer.invoke(channels.selectVideo),
  selectOutputDirectory: (): Promise<string | null> =>
    ipcRenderer.invoke(channels.selectOutputDirectory),
  getDefaultOutputDirectory: (): Promise<string> =>
    ipcRenderer.invoke(channels.getDefaultOutputDirectory),
  openOutputLocation: (outputPath: string): Promise<void> =>
    ipcRenderer.invoke(channels.openOutputLocation, outputPath),
  getVideoInfo: (filePath: string): Promise<VideoInfo> =>
    ipcRenderer.invoke(channels.getVideoInfo, filePath),
  getAudioPreviewInfo: (filePath: string): Promise<AudioPreviewInfo> =>
    ipcRenderer.invoke(channels.getAudioPreviewInfo, filePath),
  readAudioPreviewFile: (filePath: string): Promise<ArrayBuffer> =>
    ipcRenderer.invoke(channels.readAudioPreviewFile, filePath),
  createJob: (input: CreateMediaJobInput): Promise<MediaJob> =>
    ipcRenderer.invoke(channels.createJob, input),
  cancelJob: (jobId: string): Promise<void> => ipcRenderer.invoke(channels.cancelJob, jobId),
  onJobProgress: (callback: (progress: MediaJobProgress) => void): (() => void) => {
    const listener = (_: Electron.IpcRendererEvent, payload: MediaJobProgress): void =>
      callback(payload)
    ipcRenderer.on(channels.jobProgress, listener)
    return () => {
      ipcRenderer.removeListener(channels.jobProgress, listener)
    }
  },
  onJobCompleted: (callback: (result: MediaJobResult) => void): (() => void) => {
    const listener = (_: Electron.IpcRendererEvent, payload: MediaJobResult): void =>
      callback(payload)
    ipcRenderer.on(channels.jobCompleted, listener)
    return () => {
      ipcRenderer.removeListener(channels.jobCompleted, listener)
    }
  },
  onJobFailed: (callback: (error: MediaJobError) => void): (() => void) => {
    const listener = (_: Electron.IpcRendererEvent, payload: MediaJobError): void =>
      callback(payload)
    ipcRenderer.on(channels.jobFailed, listener)
    return () => {
      ipcRenderer.removeListener(channels.jobFailed, listener)
    }
  }
}

const configApi = {
  getConfig: (): Promise<AppConfig> => ipcRenderer.invoke(configChannels.get),
  setConfig: (config: Partial<AppConfig>): Promise<AppConfig> =>
    ipcRenderer.invoke(configChannels.set, config),
  onConfigUpdated: (callback: (config: AppConfig) => void): (() => void) => {
    const listener = (_: Electron.IpcRendererEvent, payload: AppConfig): void => callback(payload)
    ipcRenderer.on(configChannels.updated, listener)
    return () => {
      ipcRenderer.removeListener(configChannels.updated, listener)
    }
  }
}

const transcriptionApi = {
  transcribeAudio: (request: TranscriptionRequest): Promise<TranscriptionResponse> =>
    ipcRenderer.invoke(transcriptionChannels.transcribeAudio, request)
}

const transcriptionLibraryApi = {
  list: (): Promise<SavedTranscription[]> => ipcRenderer.invoke(transcriptionLibraryChannels.list),
  save: (input: SaveTranscriptionInput): Promise<SavedTranscription> =>
    ipcRenderer.invoke(transcriptionLibraryChannels.save, input),
  openLocation: (filePath: string): Promise<void> =>
    ipcRenderer.invoke(transcriptionLibraryChannels.openLocation, filePath)
}

const windowApi = {
  minimize: (): Promise<void> => ipcRenderer.invoke(windowChannels.minimize),
  toggleMaximize: (): Promise<boolean> => ipcRenderer.invoke(windowChannels.toggleMaximize),
  close: (): Promise<void> => ipcRenderer.invoke(windowChannels.close),
  isMaximized: (): Promise<boolean> => ipcRenderer.invoke(windowChannels.isMaximized),
  onMaximizedChanged: (callback: (isMaximized: boolean) => void): (() => void) => {
    const listener = (_: Electron.IpcRendererEvent, isMaximized: boolean): void =>
      callback(isMaximized)
    ipcRenderer.on(windowChannels.maximizedChanged, listener)
    return () => {
      ipcRenderer.removeListener(windowChannels.maximizedChanged, listener)
    }
  }
}

if (process.contextIsolated) {
  contextBridge.exposeInMainWorld('media', mediaApi)
  contextBridge.exposeInMainWorld('appConfig', configApi)
  contextBridge.exposeInMainWorld('transcription', transcriptionApi)
  contextBridge.exposeInMainWorld('transcriptionLibrary', transcriptionLibraryApi)
  contextBridge.exposeInMainWorld('windowControls', windowApi)
} else {
  // @ts-ignore - fallback for non-isolated context
  window.media = mediaApi
  // @ts-ignore - fallback for non-isolated context
  window.appConfig = configApi
  // @ts-ignore - fallback for non-isolated context
  window.transcription = transcriptionApi
  // @ts-ignore - fallback for non-isolated context
  window.transcriptionLibrary = transcriptionLibraryApi
  // @ts-ignore - fallback for non-isolated context
  window.windowControls = windowApi
}
