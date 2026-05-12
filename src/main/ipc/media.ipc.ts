import { app, BrowserWindow, ipcMain, shell } from 'electron'
import type {
  CreateMediaJobInput,
  MediaJobError,
  MediaJobProgress,
  MediaJobResult,
  VideoInfo
} from '../../shared/media'
import { MediaJobService } from '../media/jobs/media-job.service'
import {
  getAudioPreviewInfo,
  getVideoInfo,
  readAudioPreviewFile
} from '../media/files/media-file-validator'
import { selectOutputDirectory, selectVideoFile } from '../media/files/file-dialog.service'

const CHANNELS = {
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

function emitToAllWindows<T>(channel: string, payload: T): void {
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send(channel, payload)
  }
}

export function registerMediaIpcHandlers(): void {
  const jobService = new MediaJobService({
    onProgress: (event: MediaJobProgress) => {
      emitToAllWindows(CHANNELS.jobProgress, event)
    },
    onCompleted: (event: MediaJobResult) => {
      emitToAllWindows(CHANNELS.jobCompleted, event)
    },
    onFailed: (event: MediaJobError) => {
      emitToAllWindows(CHANNELS.jobFailed, event)
    }
  })

  ipcMain.handle(CHANNELS.selectVideo, async (event): Promise<string | null> => {
    const owner = BrowserWindow.fromWebContents(event.sender)
    return selectVideoFile(owner)
  })

  ipcMain.handle(CHANNELS.selectOutputDirectory, async (event): Promise<string | null> => {
    const owner = BrowserWindow.fromWebContents(event.sender)
    return selectOutputDirectory(owner)
  })

  ipcMain.handle(CHANNELS.getDefaultOutputDirectory, (): string => {
    return app.getPath('downloads')
  })

  ipcMain.handle(CHANNELS.openOutputLocation, (_, outputPath: string): void => {
    shell.showItemInFolder(outputPath)
  })

  ipcMain.handle(CHANNELS.getVideoInfo, async (_, filePath: string): Promise<VideoInfo> => {
    return getVideoInfo(filePath)
  })

  ipcMain.handle(CHANNELS.getAudioPreviewInfo, async (_, filePath: string) => {
    return getAudioPreviewInfo(filePath)
  })

  ipcMain.handle(CHANNELS.readAudioPreviewFile, async (_, filePath: string) => {
    return readAudioPreviewFile(filePath)
  })

  ipcMain.handle(CHANNELS.createJob, async (_, input: CreateMediaJobInput) => {
    return jobService.createJob(input)
  })

  ipcMain.handle(CHANNELS.cancelJob, async (_, jobId: string): Promise<void> => {
    return jobService.cancelJob(jobId)
  })
}
