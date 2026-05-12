import { useEffect, useMemo, useState } from 'react'
import type { AudioFormat, MediaJob, VideoInfo } from '../types/media'
import { SUPPORTED_VIDEO_EXTENSIONS } from '../types/media'

type UseAudioExtractorState = {
  selectedVideo: VideoInfo | null
  outputDirectory: string | null
  selectedFormat: AudioFormat
  activeJob: MediaJob | null
  progress: number | null
  statusMessage: string | null
  resultPath: string | null
  errorMessage: string | null
}

type UseAudioExtractorApi = UseAudioExtractorState & {
  isRunning: boolean
  selectVideo: () => Promise<void>
  setVideoFromPath: (videoPath: string) => Promise<void>
  selectOutputDirectory: () => Promise<void>
  setFormat: (format: AudioFormat) => void
  startExtraction: () => Promise<void>
  cancelExtraction: () => Promise<void>
  openOutputLocation: () => Promise<void>
  closeResultOverlay: () => void
}

const extensionSet = new Set<string>(SUPPORTED_VIDEO_EXTENSIONS)

export function useAudioExtractor(): UseAudioExtractorApi {
  const [state, setState] = useState<UseAudioExtractorState>({
    selectedVideo: null,
    outputDirectory: null,
    selectedFormat: 'mp3',
    activeJob: null,
    progress: null,
    statusMessage: null,
    resultPath: null,
    errorMessage: null
  })

  useEffect(() => {
    void window.media.getDefaultOutputDirectory().then((directory) => {
      setState((current) => ({
        ...current,
        outputDirectory: current.outputDirectory ?? directory
      }))
    })
  }, [])

  useEffect(() => {
    const unsubscribeProgress = window.media.onJobProgress((event) => {
      setState((current) => {
        if (!current.activeJob || current.activeJob.id !== event.jobId) {
          return current
        }

        return {
          ...current,
          progress: event.progress,
          statusMessage: event.message ?? getStatusMessage(event.progress, event.status),
          activeJob: {
            ...current.activeJob,
            status: event.status,
            progress: event.progress
          },
          errorMessage:
            event.status === 'cancelled' ? 'Extracción cancelada.' : current.errorMessage
        }
      })
    })

    const unsubscribeCompleted = window.media.onJobCompleted((event) => {
      setState((current) => {
        if (!current.activeJob || current.activeJob.id !== event.jobId) {
          return current
        }

        return {
          ...current,
          progress: 100,
          statusMessage: 'Extracción completada. El audio está listo.',
          resultPath: event.outputPath,
          errorMessage: null,
          activeJob: {
            ...current.activeJob,
            status: 'completed',
            progress: 100,
            result: {
              outputPath: event.outputPath
            }
          }
        }
      })
    })

    const unsubscribeFailed = window.media.onJobFailed((event) => {
      setState((current) => {
        if (!current.activeJob || current.activeJob.id !== event.jobId) {
          return current
        }

        return {
          ...current,
          progress: null,
          statusMessage: null,
          errorMessage: event.message,
          activeJob: {
            ...current.activeJob,
            status: 'failed',
            error: event.message
          }
        }
      })
    })

    return () => {
      unsubscribeProgress()
      unsubscribeCompleted()
      unsubscribeFailed()
    }
  }, [])

  const isRunning = useMemo(() => {
    return state.activeJob?.status === 'queued' || state.activeJob?.status === 'running'
  }, [state.activeJob?.status])

  const selectVideo = async (): Promise<void> => {
    const videoPath = await window.media.selectVideo()
    if (!videoPath) {
      return
    }

    await setVideoFromPath(videoPath)
  }

  const setVideoFromPath = async (videoPath: string): Promise<void> => {
    const extension = `.${videoPath.split('.').pop()?.toLowerCase() ?? ''}`
    if (!extensionSet.has(extension)) {
      setState((current) => ({
        ...current,
        errorMessage: `Unsupported file type. Use: ${SUPPORTED_VIDEO_EXTENSIONS.join(', ')}`
      }))
      return
    }

    try {
      const videoInfo = await window.media.getVideoInfo(videoPath)

      setState((current) => ({
        ...current,
        selectedVideo: videoInfo,
        resultPath: null,
        errorMessage: null,
        statusMessage: null,
        progress: null,
        activeJob: null
      }))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to read selected video file'
      setState((current) => ({
        ...current,
        errorMessage: message
      }))
    }
  }

  const selectOutputDirectory = async (): Promise<void> => {
    const directory = await window.media.selectOutputDirectory()
    if (!directory) {
      return
    }

    setState((current) => ({
      ...current,
      outputDirectory: directory,
      errorMessage: null
    }))
  }

  const setFormat = (format: AudioFormat): void => {
    setState((current) => ({
      ...current,
      selectedFormat: format
    }))
  }

  const startExtraction = async (): Promise<void> => {
    if (!state.selectedVideo) {
      setState((current) => ({ ...current, errorMessage: 'Select a video file first.' }))
      return
    }

    if (!state.outputDirectory) {
      setState((current) => ({ ...current, errorMessage: 'Select an output directory first.' }))
      return
    }

    setState((current) => ({
      ...current,
      errorMessage: null,
      resultPath: null,
      statusMessage: 'Preparando la extracción de audio...',
      progress: 0
    }))

    try {
      const job = await window.media.createJob({
        type: 'extract-audio',
        inputPath: state.selectedVideo.path,
        outputDirectory: state.outputDirectory,
        settings: {
          format: state.selectedFormat
        }
      })

      setState((current) => ({
        ...current,
        activeJob: job,
        statusMessage: 'Archivo en cola, iniciando proceso...',
        progress: 1,
        errorMessage: null
      }))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start extraction'
      setState((current) => ({
        ...current,
        errorMessage: message,
        statusMessage: null,
        activeJob: null
      }))
    }
  }

  const cancelExtraction = async (): Promise<void> => {
    if (!state.activeJob) {
      return
    }

    try {
      await window.media.cancelJob(state.activeJob.id)
      setState((current) => ({
        ...current,
        statusMessage: 'Cancelando la extracción...'
      }))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to cancel extraction'
      setState((current) => ({
        ...current,
        errorMessage: message
      }))
    }
  }

  const openOutputLocation = async (): Promise<void> => {
    if (!state.resultPath) {
      return
    }

    await window.media.openOutputLocation(state.resultPath)
  }

  const closeResultOverlay = (): void => {
    setState((current) => ({
      ...current,
      activeJob: null,
      progress: null,
      statusMessage: null,
      resultPath: null,
      errorMessage: null
    }))
  }

  return {
    ...state,
    isRunning,
    selectVideo,
    setVideoFromPath,
    selectOutputDirectory,
    setFormat,
    startExtraction,
    cancelExtraction,
    openOutputLocation,
    closeResultOverlay
  }
}

function getStatusMessage(progress: number | null, status: MediaJob['status']): string {
  if (status === 'queued') {
    return 'Archivo en cola, esperando para comenzar...'
  }

  if (status === 'completed') {
    return 'Extracción completada. El audio está listo.'
  }

  if (status === 'cancelled') {
    return 'Extracción cancelada.'
  }

  if (progress === null || progress < 10) {
    return 'Analizando el video y preparando la pista de audio...'
  }

  if (progress < 35) {
    return 'Extrayendo los primeros segmentos de audio...'
  }

  if (progress < 70) {
    return 'Procesando la pista principal, mantén la ventana abierta...'
  }

  if (progress < 90) {
    return 'Ya casi termina, escribiendo los últimos datos de audio...'
  }

  return 'Finalizando el archivo extraído...'
}
