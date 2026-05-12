export type TranscriptionRequest = {
  apiUrl: string
  audioPath: string
}

export type TranscriptionResponse = {
  text: string
  raw: unknown
}
