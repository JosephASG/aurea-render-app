import fs from 'fs/promises'
import path from 'path'
import { pathToFileURL } from 'url'
import {
  SUPPORTED_VIDEO_EXTENSIONS,
  type AudioPreviewInfo,
  type VideoInfo
} from '../../../shared/media'

function normalizeExtension(extension: string): string {
  return extension.toLowerCase()
}

export function assertSupportedVideoExtension(filePath: string): void {
  const extension = normalizeExtension(path.extname(filePath))
  if (
    !SUPPORTED_VIDEO_EXTENSIONS.includes(extension as (typeof SUPPORTED_VIDEO_EXTENSIONS)[number])
  ) {
    throw new Error(
      `Unsupported input file extension "${extension}". Supported formats: ${SUPPORTED_VIDEO_EXTENSIONS.join(', ')}`
    )
  }
}

export async function assertInputFileExists(filePath: string): Promise<void> {
  const stat = await fs.stat(filePath).catch(() => null)
  if (!stat || !stat.isFile()) {
    throw new Error('Input file does not exist')
  }
}

export async function assertOutputDirectoryExists(directoryPath: string): Promise<void> {
  const stat = await fs.stat(directoryPath).catch(() => null)
  if (!stat || !stat.isDirectory()) {
    throw new Error('Output directory does not exist')
  }
}

export async function getVideoInfo(filePath: string): Promise<VideoInfo> {
  await assertInputFileExists(filePath)
  assertSupportedVideoExtension(filePath)

  const stat = await fs.stat(filePath)

  return {
    path: filePath,
    name: path.basename(filePath),
    extension: normalizeExtension(path.extname(filePath)),
    sizeBytes: stat.size
  }
}

export async function getAudioPreviewInfo(filePath: string): Promise<AudioPreviewInfo> {
  await assertInputFileExists(filePath)

  const stat = await fs.stat(filePath)
  const extension = normalizeExtension(path.extname(filePath))

  return {
    path: filePath,
    name: path.basename(filePath),
    extension: extension.replace(/^\./, '').toUpperCase(),
    sizeBytes: stat.size,
    fileUrl: pathToFileURL(filePath).toString(),
    mimeType: getAudioMimeType(extension)
  }
}

export async function readAudioPreviewFile(filePath: string): Promise<ArrayBuffer> {
  await assertInputFileExists(filePath)

  const file = await fs.readFile(filePath)
  return file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength)
}

function getAudioMimeType(extension: string): string {
  switch (extension) {
    case '.mp3':
      return 'audio/mpeg'
    case '.wav':
      return 'audio/wav'
    case '.flac':
      return 'audio/flac'
    case '.aac':
      return 'audio/aac'
    case '.m4a':
      return 'audio/mp4'
    case '.ogg':
      return 'audio/ogg'
    default:
      return 'audio/*'
  }
}

// TODO: add ffprobe-backed duration detection for richer metadata.
