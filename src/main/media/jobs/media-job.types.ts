import type {
  CreateMediaJobInput,
  MediaJob,
  MediaJobError,
  MediaJobProgress,
  MediaJobResult
} from '../../../shared/media'

export type MediaJobEvents = {
  onProgress: (event: MediaJobProgress) => void
  onCompleted: (event: MediaJobResult) => void
  onFailed: (event: MediaJobError) => void
}

export type JobRunContext = {
  job: MediaJob
  input: CreateMediaJobInput
}
