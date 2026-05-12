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

type MediaApi = {
  selectVideo: () => Promise<string | null>
  selectOutputDirectory: () => Promise<string | null>
  getDefaultOutputDirectory: () => Promise<string>
  openOutputLocation: (outputPath: string) => Promise<void>
  getVideoInfo: (filePath: string) => Promise<VideoInfo>
  getAudioPreviewInfo: (filePath: string) => Promise<AudioPreviewInfo>
  readAudioPreviewFile: (filePath: string) => Promise<ArrayBuffer>
  createJob: (input: CreateMediaJobInput) => Promise<MediaJob>
  cancelJob: (jobId: string) => Promise<void>
  onJobProgress: (callback: (progress: MediaJobProgress) => void) => () => void
  onJobCompleted: (callback: (result: MediaJobResult) => void) => () => void
  onJobFailed: (callback: (error: MediaJobError) => void) => () => void
}

type AppConfigApi = {
  getConfig: () => Promise<AppConfig>
  setConfig: (config: Partial<AppConfig>) => Promise<AppConfig>
  onConfigUpdated: (callback: (config: AppConfig) => void) => () => void
}

type TranscriptionApi = {
  transcribeAudio: (request: TranscriptionRequest) => Promise<TranscriptionResponse>
}

declare global {
  interface Window {
    media: MediaApi
    appConfig: AppConfigApi
    transcription: TranscriptionApi
  }
}

export {}
