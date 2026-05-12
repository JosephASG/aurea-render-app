import type { MediaAdapter, RunOperationOptions, RunningOperation } from '../media-adapter.types'
import type { MediaOperation } from '../../operations/media-operation.types'
import { buildExtractAudioArgs } from './ffmpeg-command-builder'
import { FfmpegProgressParser } from './ffmpeg-progress-parser'
import { resolveFfmpegBinary } from './ffmpeg-binary-resolver'
import { ProcessRunner } from '../../runner/process-runner'

export class FfmpegAdapter implements MediaAdapter {
  private readonly processRunner = new ProcessRunner()

  canRun(operation: MediaOperation): boolean {
    return operation.type === 'extract-audio'
  }

  run(operation: MediaOperation, options?: RunOperationOptions): RunningOperation {
    if (operation.type !== 'extract-audio') {
      throw new Error(`FFmpeg adapter does not support operation: ${operation.type as string}`)
    }

    const ffmpegBinary = resolveFfmpegBinary()
    const args = buildExtractAudioArgs(operation)
    const parser = new FfmpegProgressParser()

    const running = this.processRunner.run({
      command: ffmpegBinary,
      args,
      onStderrLine: (line) => {
        const progress = parser.parseLine(line)

        if (progress === null) {
          return
        }

        options?.onProgress?.({
          progress: Math.max(5, Math.min(95, progress)),
          message: createProgressMessage(progress)
        })
      }
    })

    return {
      cancel: running.cancel,
      completion: running.completion.then(() => ({
        outputPath: operation.outputPath
      }))
    }
  }
}

function createProgressMessage(progress: number): string {
  if (progress < 10) {
    return 'Analizando el video y preparando la pista de audio...'
  }

  if (progress < 35) {
    return 'Extrayendo los primeros segmentos de audio...'
  }

  if (progress < 70) {
    return 'Procesando la pista principal, mantén la ventana abierta...'
  }

  if (progress < 90) {
    return 'Ya casi termina, escribiendo los últimos datos de audio...'
  }

  return 'Finalizando el archivo extraído...'
}
