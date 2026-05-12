import { randomUUID } from 'crypto'
import type { CreateMediaJobInput, MediaJob } from '../../../shared/media'
import { MediaEngine } from '../media-engine'
import { MediaJobStore } from './media-job-store'
import type { MediaJobEvents } from './media-job.types'
import {
  assertInputFileExists,
  assertOutputDirectoryExists,
  assertSupportedVideoExtension
} from '../files/media-file-validator'
import { createUniqueOutputPath } from '../files/output-path.service'
import { createExtractAudioOperation } from '../operations/extract-audio.operation'

type ActiveJobState = {
  jobId: string
  cancel: () => void
}

export class MediaJobService {
  private readonly store = new MediaJobStore()
  private readonly engine = new MediaEngine()
  private readonly cancelRequested = new Set<string>()
  private activeJob: ActiveJobState | null = null

  constructor(private readonly events: MediaJobEvents) {}

  async createJob(input: CreateMediaJobInput): Promise<MediaJob> {
    if (this.activeJob) {
      throw new Error('Another media job is already running. Please wait or cancel it first.')
    }

    await assertInputFileExists(input.inputPath)
    assertSupportedVideoExtension(input.inputPath)
    await assertOutputDirectoryExists(input.outputDirectory)

    const job: MediaJob = this.store.create({
      id: randomUUID(),
      type: 'extract-audio',
      inputPath: input.inputPath,
      outputDirectory: input.outputDirectory,
      status: 'queued',
      progress: null,
      createdAt: Date.now()
    })

    void this.runExtractAudioJob(job.id, input)

    return job
  }

  async cancelJob(jobId: string): Promise<void> {
    const job = this.store.get(jobId)
    if (!job) {
      throw new Error('Job not found')
    }

    if (!this.activeJob || this.activeJob.jobId !== jobId) {
      throw new Error('Only the active running job can be cancelled')
    }

    this.cancelRequested.add(jobId)
    this.activeJob.cancel()
  }

  private async runExtractAudioJob(jobId: string, input: CreateMediaJobInput): Promise<void> {
    const runningJob = this.store.update(jobId, {
      status: 'running',
      progress: 0,
      startedAt: Date.now()
    })

    this.events.onProgress({
      jobId,
      progress: runningJob.progress,
      status: runningJob.status,
      message: 'Preparando la extracción de audio...'
    })

    const outputPath = createUniqueOutputPath(
      input.outputDirectory,
      input.inputPath,
      input.settings.format
    )

    const operation = createExtractAudioOperation({
      inputPath: input.inputPath,
      outputPath,
      format: input.settings.format
    })

    const preparedJob = this.store.update(jobId, {
      progress: 2,
      status: 'running'
    })

    this.events.onProgress({
      jobId,
      progress: preparedJob.progress,
      status: preparedJob.status,
      message: 'Archivo de salida listo, iniciando FFmpeg...'
    })

    const runningOperation = this.engine.run(operation, {
      onProgress: ({ progress, message }) => {
        const updated = this.store.update(jobId, {
          progress,
          status: 'running'
        })

        this.events.onProgress({
          jobId,
          progress: updated.progress,
          status: updated.status,
          message
        })
      }
    })

    this.activeJob = {
      jobId,
      cancel: runningOperation.cancel
    }

    try {
      const result = await runningOperation.completion

      if (this.cancelRequested.has(jobId)) {
        const cancelled = this.store.update(jobId, {
          status: 'cancelled',
          progress: null,
          finishedAt: Date.now()
        })

        this.events.onProgress({
          jobId,
          progress: cancelled.progress,
          status: cancelled.status,
          message: 'Extraction cancelled'
        })
        return
      }

      const finalizing = this.store.update(jobId, {
        status: 'running',
        progress: 98
      })

      this.events.onProgress({
        jobId,
        progress: finalizing.progress,
        status: finalizing.status,
        message: 'Validando el resultado y cerrando el archivo...'
      })

      this.store.update(jobId, {
        status: 'completed',
        progress: 100,
        finishedAt: Date.now(),
        result: {
          outputPath: result.outputPath
        }
      })

      this.events.onProgress({
        jobId,
        progress: 100,
        status: 'completed',
        message: 'Extracción completada. El audio está listo.'
      })

      this.events.onCompleted({
        jobId,
        outputPath: result.outputPath
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown extraction error'
      const isCancelled =
        this.cancelRequested.has(jobId) || message.toLowerCase().includes('cancel')

      const failedStatus = isCancelled ? 'cancelled' : 'failed'

      this.store.update(jobId, {
        status: failedStatus,
        progress: null,
        finishedAt: Date.now(),
        error: isCancelled ? undefined : message
      })

      if (isCancelled) {
        this.events.onProgress({
          jobId,
          progress: null,
          status: 'cancelled',
          message: 'Extraction cancelled'
        })
      } else {
        this.events.onFailed({
          jobId,
          message
        })
      }
    } finally {
      this.activeJob = null
      this.cancelRequested.delete(jobId)
    }
  }
}

// TODO: add queue + persistence for batch processing.
