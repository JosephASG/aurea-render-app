import type { AudioFormat } from '../../../shared/media'

export type ExtractAudioOperation = {
  type: 'extract-audio'
  inputPath: string
  outputPath: string
  format: AudioFormat
}

export type MediaOperation = ExtractAudioOperation

// TODO: Extend this union as trim/convert/thumbnail/waveform operations are implemented.
