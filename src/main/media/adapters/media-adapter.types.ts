import type { MediaOperation } from '../operations/media-operation.types'

export type OperationProgress = {
  progress: number | null
  message?: string
}

export type RunOperationOptions = {
  onProgress?: (progress: OperationProgress) => void
}

export type RunningOperation = {
  cancel: () => void
  completion: Promise<{ outputPath: string }>
}

export interface MediaAdapter {
  canRun(operation: MediaOperation): boolean
  run(operation: MediaOperation, options?: RunOperationOptions): RunningOperation
}
