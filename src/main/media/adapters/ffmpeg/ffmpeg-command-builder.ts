import path from 'path'
import type { AudioFormat } from '../../../../shared/media'
import type { ExtractAudioOperation } from '../../operations/media-operation.types'

const outputExtensionByFormat: Record<AudioFormat, string> = {
  original: '.m4a',
  mp3: '.mp3',
  wav: '.wav',
  flac: '.flac',
  aac: '.m4a'
}

export function getOutputExtension(format: AudioFormat): string {
  return outputExtensionByFormat[format]
}

export function buildExtractAudioArgs(operation: ExtractAudioOperation): string[] {
  const { inputPath, outputPath, format } = operation

  const outputExtension = path.extname(outputPath).toLowerCase()
  if (outputExtension !== getOutputExtension(format)) {
    throw new Error(`Output extension mismatch for format "${format}"`)
  }

  const args = ['-y', '-i', inputPath, '-vn']

  if (format === 'original') {
    return [...args, '-c:a', 'copy', outputPath]
  }

  if (format === 'mp3') {
    return [...args, '-codec:a', 'libmp3lame', '-q:a', '0', outputPath]
  }

  if (format === 'wav') {
    return [...args, '-acodec', 'pcm_s16le', outputPath]
  }

  if (format === 'flac') {
    return [...args, '-c:a', 'flac', outputPath]
  }

  if (format === 'aac') {
    return [...args, '-c:a', 'aac', '-b:a', '320k', outputPath]
  }

  throw new Error(`Unsupported audio format: ${format as string}`)
}
