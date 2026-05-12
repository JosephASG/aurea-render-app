import { ipcMain } from 'electron'
import { createReadStream } from 'fs'
import { basename } from 'path'
import axios from 'axios'
import FormData from 'form-data'
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

      const formData = new FormData()
      formData.append('file', createReadStream(audioPath), basename(audioPath))

      const response = await axios.post<unknown>(apiUrl, formData, {
        headers: formData.getHeaders(),
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        timeout: 120_000
      })

      return {
        text: extractTranscriptionText(response.data),
        raw: response.data
      }
    }
  )
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
