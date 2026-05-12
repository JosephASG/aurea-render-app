import { useEffect, useState } from 'react'
import AudioPreviewPlayer from './AudioPreviewPlayer'

type ExtractionOverlayProps = {
  progress: number | null
  statusMessage: string | null
  resultPath: string | null
  isVisible: boolean
  onCancel: () => Promise<void>
  onClose: () => void
  onOpenOutputLocation: () => Promise<void>
}

export default function ExtractionOverlay({
  progress,
  statusMessage,
  resultPath,
  isVisible,
  onCancel,
  onClose,
  onOpenOutputLocation
}: ExtractionOverlayProps): React.JSX.Element | null {
  const [displayProgress, setDisplayProgress] = useState(0)
  const targetProgress = progress ?? 0
  const shownProgress = displayProgress > targetProgress ? targetProgress : displayProgress
  const isComplete = Boolean(resultPath)

  useEffect(() => {
    if (!isVisible) {
      return
    }

    const interval = window.setInterval(() => {
      setDisplayProgress((current) => {
        if (current === targetProgress) {
          return current
        }

        if (current > targetProgress) {
          return targetProgress
        }

        return Math.min(current + 1, targetProgress)
      })
    }, 24)

    return () => window.clearInterval(interval)
  }, [isVisible, targetProgress])

  if (!isVisible) {
    return null
  }

  return (
    <div className="extraction-overlay fixed inset-0 z-50 grid place-items-center px-5">
      <div className="extraction-dialog relative w-full max-w-3xl rounded-[2rem] border p-6 shadow-2xl">
        {isComplete ? (
          <button
            type="button"
            onClick={onClose}
            className="overlay-close-button absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full text-lg font-black"
            aria-label="Cerrar visualizador de audio"
          >
            ×
          </button>
        ) : null}

        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="app-kicker text-xs font-semibold uppercase tracking-[0.22em]">
              {isComplete ? 'Audio listo' : 'Processing'}
            </p>
            <h2 className="app-title mt-3 text-3xl font-black tracking-tight">
              {isComplete ? 'Audio separado' : 'Extrayendo audio'}
            </h2>
            <p className="app-muted mt-2 text-sm">
              {statusMessage ??
                (isComplete
                  ? 'Revisa y reproduce el resultado extraído.'
                  : 'Preparando el motor multimedia...')}
            </p>
          </div>
          {!isComplete ? (
            <div className="progress-orb grid h-16 w-16 shrink-0 place-items-center rounded-full text-sm font-black">
              {shownProgress}%
            </div>
          ) : null}
        </div>

        {resultPath ? (
          <div className="mt-6">
            <AudioPreviewPlayer
              outputPath={resultPath}
              onOpenOutputLocation={onOpenOutputLocation}
            />
          </div>
        ) : (
          <div className="progress-track mt-6 h-4 overflow-hidden rounded-full">
            <div
              className="progress-fill h-full rounded-full"
              style={{ width: `${shownProgress}%` }}
            />
          </div>
        )}

        <div className="mt-5 flex items-center justify-between gap-3">
          <p className="app-muted text-xs">
            {isComplete
              ? 'Cierra este panel para separar otro audio.'
              : 'La ventana queda bloqueada hasta terminar o cancelar.'}
          </p>
          {isComplete ? (
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
            >
              Separar otro audio
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                void onCancel()
              }}
              className="rounded-xl border border-rose-300/60 px-4 py-2 text-sm font-medium text-rose-200 transition hover:bg-rose-400/10"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
