import { app, ipcMain, shell } from 'electron'
import { mkdir, readdir, readFile, stat, writeFile } from 'fs/promises'
import { basename, join } from 'path'
import type { SavedTranscription, SaveTranscriptionInput } from '../../shared/transcription-library'

const CHANNELS = {
  list: 'transcription-library:list',
  save: 'transcription-library:save',
  openLocation: 'transcription-library:open-location'
} as const

const reservedWindowsNames = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i

function getTranscriptionsDirectory(): string {
  return join(app.getPath('userData'), 'transcriptions')
}

function sanitizeTitle(title: string): string {
  const normalizedTitle = title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s-_]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase()
    .slice(0, 80)

  if (!normalizedTitle || reservedWindowsNames.test(normalizedTitle)) {
    return 'transcripcion'
  }

  return normalizedTitle
}

function getTitleFromFileName(fileName: string): string {
  return basename(fileName, '.txt')
    .replace(/-\d{13}$/, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

async function ensureTranscriptionsDirectory(): Promise<string> {
  const directory = getTranscriptionsDirectory()
  await mkdir(directory, { recursive: true })
  return directory
}

async function listSavedTranscriptions(): Promise<SavedTranscription[]> {
  const directory = await ensureTranscriptionsDirectory()
  const entries = await readdir(directory, { withFileTypes: true })
  const transcriptions = await Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.txt'))
      .map(async (entry): Promise<SavedTranscription> => {
        const path = join(directory, entry.name)
        const [fileStat, content] = await Promise.all([stat(path), readFile(path, 'utf-8')])

        return {
          id: entry.name,
          title: getTitleFromFileName(entry.name),
          fileName: entry.name,
          path,
          content,
          createdAt: fileStat.birthtime.toISOString(),
          updatedAt: fileStat.mtime.toISOString(),
          sizeBytes: fileStat.size
        }
      })
  )

  return transcriptions.sort(
    (current, next) => Date.parse(next.updatedAt) - Date.parse(current.updatedAt)
  )
}

async function saveTranscription(input: SaveTranscriptionInput): Promise<SavedTranscription> {
  const title = input.title.trim()
  const content = input.content.trim()

  if (!title) {
    throw new Error('Agrega un título para guardar la transcripción.')
  }

  if (!content) {
    throw new Error('Pega el texto de la transcripción antes de guardar.')
  }

  const directory = await ensureTranscriptionsDirectory()
  const fileName = `${sanitizeTitle(title)}-${Date.now()}.txt`
  const path = join(directory, fileName)

  await writeFile(path, `${content}\n`, 'utf-8')

  const fileStat = await stat(path)

  return {
    id: fileName,
    title,
    fileName,
    path,
    content,
    createdAt: fileStat.birthtime.toISOString(),
    updatedAt: fileStat.mtime.toISOString(),
    sizeBytes: fileStat.size
  }
}

export function registerTranscriptionLibraryIpcHandlers(): void {
  ipcMain.handle(CHANNELS.list, async (): Promise<SavedTranscription[]> => {
    return listSavedTranscriptions()
  })

  ipcMain.handle(
    CHANNELS.save,
    async (_, input: SaveTranscriptionInput): Promise<SavedTranscription> => {
      return saveTranscription(input)
    }
  )

  ipcMain.handle(CHANNELS.openLocation, (_, filePath: string): void => {
    shell.showItemInFolder(filePath)
  })
}
