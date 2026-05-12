import fs from 'fs'
import path from 'path'
import type { AudioFormat } from '../../../shared/media'
import { getOutputExtension } from '../adapters/ffmpeg/ffmpeg-command-builder'

function sanitizeName(input: string): string {
  return input
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
}

function getSafeBaseName(inputPath: string): string {
  const parsed = path.parse(inputPath)
  const cleaned = sanitizeName(parsed.name)
  return cleaned.length > 0 ? cleaned : 'media'
}

export function buildDefaultOutputName(inputPath: string, format: AudioFormat): string {
  const baseName = getSafeBaseName(inputPath)
  return `${baseName}.audio${getOutputExtension(format)}`
}

export function createUniqueOutputPath(
  outputDirectory: string,
  inputPath: string,
  format: AudioFormat
): string {
  const extension = getOutputExtension(format)
  const baseName = getSafeBaseName(inputPath)
  const originalCandidate = path.join(outputDirectory, `${baseName}.audio${extension}`)

  if (!fs.existsSync(originalCandidate)) {
    return originalCandidate
  }

  let index = 1
  while (index < 10_000) {
    const candidate = path.join(outputDirectory, `${baseName}.audio-${index}${extension}`)
    if (!fs.existsSync(candidate)) {
      return candidate
    }
    index += 1
  }

  throw new Error('Unable to create a unique output filename in the selected directory')
}
