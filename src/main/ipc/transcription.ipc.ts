import { ipcMain } from 'electron'
import { readFile } from 'fs/promises'
import { basename } from 'path'
import type { TranscriptionRequest, TranscriptionResponse } from '../../shared/transcription'

const CHANNELS = {
  transcribeAudio: 'transcription:transcribe-audio'
} as const

export function registerTranscriptionIpcHandlers(): void {
  ipcMain.handle(
    CHANNELS.transcribeAudio,
    async (_, request: TranscriptionRequest): Promise<TranscriptionResponse> => {
      const apiUrl = request.apiUrl.trim()
      const audioPath = request.audioPath.trim()

      if (!apiUrl) {
        throw new Error('Configura la URL de la API de transcripción.')
      }

      if (!audioPath) {
        throw new Error('Selecciona un archivo de audio para transcribir.')
      }

      const audioBytes = await readFile(audioPath)
      const formData = new FormData()
      formData.append('file', new Blob([audioBytes]), basename(audioPath))
      const abortController = new AbortController()
      const timeout = setTimeout(() => abortController.abort(), 120_000)

      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
        signal: abortController.signal
      }).finally(() => clearTimeout(timeout))

      const responsePayload = await parseTranscriptionResponse(response)

      if (!response.ok) {
        throw new Error(`La API respondió con estado ${response.status}.`)
      }

      return {
        text: extractTranscriptionText(responsePayload),
        raw: responsePayload
      }
    }
  )
}

async function parseTranscriptionResponse(response: Response): Promise<unknown> {
  const responseText = await response.text()

  if (!responseText) {
    return null
  }

  try {
    return JSON.parse(responseText)
  } catch {
    return responseText
  }
}

function extractTranscriptionText(payload: unknown): string {
  if (typeof payload === 'string') {
    return payload
  }

  if (!payload || typeof payload !== 'object') {
    return ''
  }

  const result = payload as Record<string, unknown>
  const candidate = result.text ?? result.transcription ?? result.transcript

  return typeof candidate === 'string' ? candidate : ''
}
