import { useMemo, useState } from 'react'
import type { VideoInfo } from '../types/media'
import { SUPPORTED_VIDEO_EXTENSIONS } from '../types/media'

function formatBytes(bytes: number): string {
  if (bytes === 0) {
    return '0 B'
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const index = Math.floor(Math.log(bytes) / Math.log(1024))
  const value = bytes / 1024 ** index
  return `${value.toFixed(index === 0 ? 0 : 2)} ${units[index]}`
}

type VideoDropzoneProps = {
  selectedVideo: VideoInfo | null
  onPickVideo: () => Promise<void>
  onVideoPathSelected: (path: string) => Promise<void>
  disabled?: boolean
}

export default function VideoDropzone({
  selectedVideo,
  onPickVideo,
  onVideoPathSelected,
  disabled = false
}: VideoDropzoneProps): React.JSX.Element {
  const [isDragActive, setIsDragActive] = useState(false)
  const acceptLabel = useMemo(() => SUPPORTED_VIDEO_EXTENSIONS.join(', '), [])

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>): Promise<void> => {
    event.preventDefault()
    setIsDragActive(false)

    if (disabled) {
      return
    }

    const file = event.dataTransfer.files?.[0]
    const filePath = (file as File & { path?: string })?.path

    if (!filePath) {
      return
    }

    await onVideoPathSelected(filePath)
  }

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault()
        if (!disabled) {
          setIsDragActive(true)
        }
      }}
      onDragLeave={() => setIsDragActive(false)}
      onDrop={handleDrop}
      className={`rounded-2xl border border-dashed p-8 transition-all ${isDragActive ? 'dropzone-active' : 'dropzone-idle'} ${disabled ? 'opacity-60' : ''}`}
    >
      {selectedVideo ? (
        <div className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="app-label text-xs font-semibold uppercase tracking-wide">
                Video seleccionado
              </p>
              <p className="app-title mt-1 break-all text-lg font-semibold">{selectedVideo.name}</p>
            </div>
            <button
              type="button"
              disabled={disabled}
              onClick={() => {
                void onPickVideo()
              }}
              className="rounded-xl bg-cyan-400 px-4 py-2 font-semibold text-slate-900 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Select another video
            </button>
          </div>

          <div className="grid gap-2 text-sm sm:grid-cols-3">
            <p className="app-text">
              <span className="app-muted">Extension:</span> {selectedVideo.extension}
            </p>
            <p className="app-text">
              <span className="app-muted">Size:</span> {formatBytes(selectedVideo.sizeBytes)}
            </p>
            <p className="app-muted break-all sm:col-span-3">{selectedVideo.path}</p>
          </div>

          <p className="app-muted text-xs">Drop another video here if you want to replace it.</p>
        </div>
      ) : (
        <>
          <p className="app-title text-lg font-semibold">Drop a video file here</p>
          <p className="app-muted mt-2 text-sm">Supported formats: {acceptLabel}</p>
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              void onPickVideo()
            }}
            className="mt-5 rounded-xl bg-cyan-400 px-4 py-2 font-semibold text-slate-900 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Select video
          </button>
        </>
      )}
    </div>
  )
}
