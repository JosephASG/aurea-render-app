export type AudioFormat = 'original' | 'mp3' | 'wav' | 'flac' | 'aac'

export type MediaJobType =
  | 'extract-audio'
  | 'trim-video'
  | 'convert-video'
  | 'merge-video'
  | 'generate-thumbnail'
  | 'normalize-audio'
  | 'remove-silence'
  | 'extract-frames'
  | 'generate-waveform'

export type MediaJobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'

export type ExtractAudioSettings = {
  format: AudioFormat
}

export type CreateMediaJobInput = {
  type: 'extract-audio'
  inputPath: string
  outputDirectory: string
  settings: ExtractAudioSettings
}

export type MediaJob = {
  id: string
  type: 'extract-audio'
  inputPath: string
  outputDirectory: string
  status: MediaJobStatus
  progress: number | null
  createdAt: number
  startedAt?: number
  finishedAt?: number
  error?: string
  result?: {
    outputPath: string
  }
}

export type MediaJobProgress = {
  jobId: string
  progress: number | null
  status: MediaJobStatus
  message?: string
}

export type MediaJobResult = {
  jobId: string
  outputPath: string
}

export type MediaJobError = {
  jobId: string
  message: string
}

export type VideoInfo = {
  path: string
  name: string
  extension: string
  sizeBytes: number
  durationSeconds?: number
}

export type AudioPreviewInfo = {
  path: string
  name: string
  extension: string
  sizeBytes: number
  fileUrl: string
  mimeType: string
}

export const SUPPORTED_VIDEO_EXTENSIONS = ['.mp4', '.mov', '.mkv', '.webm', '.avi', '.m4v'] as const
