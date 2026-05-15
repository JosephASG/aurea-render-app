export type SavedTranscription = {
  id: string
  title: string
  fileName: string
  path: string
  content: string
  createdAt: string
  updatedAt: string
  sizeBytes: number
}

export type SaveTranscriptionInput = {
  title: string
  content: string
}
