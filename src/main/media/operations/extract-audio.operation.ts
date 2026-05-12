import type { AudioFormat } from '../../../shared/media'
import type { ExtractAudioOperation } from './media-operation.types'

export function createExtractAudioOperation(params: {
  inputPath: string
  outputPath: string
  format: AudioFormat
}): ExtractAudioOperation {
  return {
    type: 'extract-audio',
    inputPath: params.inputPath,
    outputPath: params.outputPath,
    format: params.format
  }
}

// TODO: add operation creators for trim/convert/thumbnail/waveform workflows.
