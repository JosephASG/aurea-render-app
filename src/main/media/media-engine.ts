import type { RunningOperation } from './adapters/media-adapter.types'
import type { MediaOperation } from './operations/media-operation.types'
import { FfmpegAdapter } from './adapters/ffmpeg/ffmpeg.adapter'

export type MediaEngineRunOptions = {
  onProgress?: (progress: { progress: number | null; message?: string }) => void
}

export class MediaEngine {
  private readonly adapters = [new FfmpegAdapter()]

  run(operation: MediaOperation, options?: MediaEngineRunOptions): RunningOperation {
    const adapter = this.adapters.find((candidate) => candidate.canRun(operation))
    if (!adapter) {
      throw new Error(`No media adapter found for operation: ${operation.type as string}`)
    }

    return adapter.run(operation, { onProgress: options?.onProgress })
  }
}
