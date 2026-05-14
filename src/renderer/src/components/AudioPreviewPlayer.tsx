import { useEffect, useRef, useState } from 'react'
import type { AudioPreviewInfo } from '../types/media'

const elevenLabsTranscriptionUrl = 'https://elevenlabs.io/es/audio-to-text'

type AudioPreviewPlayerProps = {
  outputPath: string
  onOpenOutputLocation: () => Promise<void>
}

export default function AudioPreviewPlayer({
  outputPath,
  onOpenOutputLocation
}: AudioPreviewPlayerProps): React.JSX.Element {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const audioUrlRef = useRef<string | null>(null)
  const isDraggingRef = useRef(false)
  const [audioInfo, setAudioInfo] = useState<AudioPreviewInfo | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [waveform, setWaveform] = useState<number[]>([])
  const [isWaveformLoading, setIsWaveformLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current)
      audioUrlRef.current = null
    }

    void window.media
      .getAudioPreviewInfo(outputPath)
      .then((info) => {
        if (!isMounted) {
          return
        }

        setAudioInfo(info)
        setIsWaveformLoading(true)

        void loadAudioPreview(info.path, info.mimeType)
          .then((preview) => {
            if (!isMounted) {
              URL.revokeObjectURL(preview.url)
              return
            }

            if (audioUrlRef.current) {
              URL.revokeObjectURL(audioUrlRef.current)
            }

            audioUrlRef.current = preview.url
            setAudioUrl(preview.url)
            setWaveform(preview.waveform)
            setIsWaveformLoading(false)
          })
          .catch((error) => {
            const message = error instanceof Error ? error.message : 'No se pudo cargar el audio.'
            if (isMounted) {
              setErrorMessage(message)
              setIsWaveformLoading(false)
            }
          })
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : 'No se pudo leer el audio.'
        if (isMounted) {
          setErrorMessage(message)
          setIsWaveformLoading(false)
        }
      })

    return () => {
      isMounted = false
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current)
        audioUrlRef.current = null
      }
    }
  }, [outputPath])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }

    const draw = (): void => {
      const context = canvas.getContext('2d')
      if (!context) {
        return
      }

      const scale = window.devicePixelRatio || 1
      const width = canvas.clientWidth * scale
      const height = canvas.clientHeight * scale
      const progress = duration > 0 ? currentTime / duration : 0

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
      }

      context.clearRect(0, 0, width, height)
      context.lineCap = 'round'

      const gap = 4 * scale
      const barWidth = 3 * scale
      const totalBars = Math.min(waveform.length, Math.floor(width / (barWidth + gap)))
      const startX = (width - totalBars * (barWidth + gap)) / 2

      if (totalBars === 0) {
        context.strokeStyle = 'rgba(255, 255, 255, 0.22)'
        context.lineWidth = 1 * scale
        context.beginPath()
        context.moveTo(0, height / 2)
        context.lineTo(width, height / 2)
        context.stroke()
        return
      }

      const drawBars = (color: string): void => {
        context.strokeStyle = color
        context.lineWidth = barWidth

        for (let index = 0; index < totalBars; index += 1) {
          const value = waveform[Math.floor((index / totalBars) * waveform.length)] ?? 0.2
          const barHeight = Math.max(8 * scale, value * height * 0.88)
          const x = startX + index * (barWidth + gap)
          const y = (height - barHeight) / 2

          context.beginPath()
          context.moveTo(x, y)
          context.lineTo(x, y + barHeight)
          context.stroke()
        }
      }

      drawBars('rgba(255, 255, 255, 0.24)')

      context.save()
      context.beginPath()
      context.rect(0, 0, width * progress, height)
      context.clip()
      drawBars('#130600')
      context.restore()

      const playheadX = Math.max(2 * scale, Math.min(width - 2 * scale, width * progress))

      context.strokeStyle = '#ffffff'
      context.lineWidth = 2 * scale
      context.beginPath()
      context.moveTo(playheadX, 8 * scale)
      context.lineTo(playheadX, height - 8 * scale)
      context.stroke()

      context.fillStyle = '#ffffff'
      context.beginPath()
      context.arc(playheadX, height / 2, 5 * scale, 0, Math.PI * 2)
      context.fill()

      context.fillStyle = '#ff4d00'
      context.beginPath()
      context.arc(playheadX, height / 2, 2.4 * scale, 0, Math.PI * 2)
      context.fill()
    }

    draw()

    if (isPlaying) {
      const tick = (): void => {
        setCurrentTime(audioRef.current?.currentTime ?? 0)
        draw()
        animationFrameRef.current = window.requestAnimationFrame(tick)
      }

      animationFrameRef.current = window.requestAnimationFrame(tick)
    }

    return () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
    }
  }, [currentTime, duration, isPlaying, waveform])

  const togglePlayback = async (): Promise<void> => {
    const audio = audioRef.current
    if (!audio) {
      return
    }

    if (audio.paused) {
      try {
        await audio.play()
        setIsPlaying(true)
        setErrorMessage(null)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'No se pudo reproducir el audio.'
        setErrorMessage(message)
      }
    } else {
      audio.pause()
      setIsPlaying(false)
    }
  }

  const seekFromCanvasPosition = (clientX: number): void => {
    const audio = audioRef.current
    const canvas = canvasRef.current
    if (!audio || !canvas || duration <= 0) {
      return
    }

    const bounds = canvas.getBoundingClientRect()
    const nextTime = ((clientX - bounds.left) / bounds.width) * duration
    audio.currentTime = Math.max(0, Math.min(duration, nextTime))
    setCurrentTime(audio.currentTime)
  }

  const startSeekDrag = (event: React.PointerEvent<HTMLCanvasElement>): void => {
    isDraggingRef.current = true
    event.currentTarget.setPointerCapture(event.pointerId)
    seekFromCanvasPosition(event.clientX)
  }

  const updateSeekDrag = (event: React.PointerEvent<HTMLCanvasElement>): void => {
    if (!isDraggingRef.current) {
      return
    }

    seekFromCanvasPosition(event.clientX)
  }

  const stopSeekDrag = (event: React.PointerEvent<HTMLCanvasElement>): void => {
    if (!isDraggingRef.current) {
      return
    }

    isDraggingRef.current = false
    event.currentTarget.releasePointerCapture(event.pointerId)
  }

  return (
    <section className="audio-preview-card overflow-hidden rounded-[2rem] border p-5 shadow-[0_24px_70px_var(--shadow-color)]">
      <audio
        ref={audioRef}
        src={audioUrl ?? undefined}
        preload="metadata"
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || 0)}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
      />

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="audio-recording-label text-sm font-semibold">Audio ready</p>
          <p className="audio-time mt-2 font-black tracking-tight">{formatDuration(duration)}</p>
          <p className="mt-2 max-w-md break-all text-xs text-white/45">
            {audioInfo?.name ?? outputPath}
          </p>
        </div>
        <div className="grid gap-2 text-right">
          <span className="audio-size-pill rounded-full px-3 py-1 text-xs font-black">
            {formatBytes(audioInfo?.sizeBytes ?? 0)}
          </span>
          <span className="text-sm font-black text-white/70">
            .{audioInfo?.extension ?? 'AUDIO'}
          </span>
        </div>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-[1fr_auto] md:items-end">
        <div className="audio-wave-shell rounded-[1.5rem] p-4">
          <canvas
            ref={canvasRef}
            width={720}
            height={112}
            onPointerDown={startSeekDrag}
            onPointerMove={updateSeekDrag}
            onPointerUp={stopSeekDrag}
            onPointerCancel={stopSeekDrag}
            className="h-28 w-full cursor-grab touch-none active:cursor-grabbing"
          />
          {isWaveformLoading ? (
            <div className="audio-wave-spinner" role="status" aria-label="Cargando ondas" />
          ) : null}
          <div className="mt-2 flex justify-between text-xs font-semibold text-black/70">
            <span>{formatDuration(currentTime)}</span>
            <span>{formatDuration(duration)}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 md:justify-end">
          <a
            href={elevenLabsTranscriptionUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-14 items-center justify-center rounded-full bg-cyan-300 px-5 text-sm font-black text-slate-950 transition hover:bg-cyan-200"
          >
            Transcribir con ElevenLabs
          </a>
          <button
            type="button"
            onClick={() => {
              void togglePlayback()
            }}
            disabled={!audioUrl}
            className="audio-control-button grid h-14 w-14 place-items-center rounded-full text-lg font-black"
            aria-label={isPlaying ? 'Pause audio preview' : 'Play audio preview'}
          >
            {isPlaying ? 'Ⅱ' : '▶'}
          </button>
          <button
            type="button"
            onClick={() => {
              void onOpenOutputLocation()
            }}
            className="audio-control-button grid h-14 w-14 place-items-center rounded-full text-lg font-black"
            aria-label="Open output location"
          >
            ⊡
          </button>
        </div>
      </div>

      {errorMessage ? <p className="mt-4 text-sm text-orange-200">{errorMessage}</p> : null}
    </section>
  )
}

async function loadAudioPreview(
  filePath: string,
  mimeType: string
): Promise<{ url: string; waveform: number[] }> {
  const fileBytes = await window.media.readAudioPreviewFile(filePath)
  const playbackBuffer = fileBytes.slice(0)
  const waveformBuffer = fileBytes.slice(0)
  const blob = new Blob([playbackBuffer], { type: mimeType })

  return {
    url: URL.createObjectURL(blob),
    waveform: await extractWaveform(waveformBuffer)
  }
}

async function extractWaveform(buffer: ArrayBuffer): Promise<number[]> {
  const audioContext = new AudioContext()

  try {
    const audioBuffer = await audioContext.decodeAudioData(buffer)
    const sampleCount = 192
    const blockSize = Math.max(1, Math.floor(audioBuffer.length / sampleCount))

    return Array.from({ length: sampleCount }, (_, index) => {
      const start = index * blockSize
      const end = Math.min(start + blockSize, audioBuffer.length)
      let peak = 0

      for (let channelIndex = 0; channelIndex < audioBuffer.numberOfChannels; channelIndex += 1) {
        const channelData = audioBuffer.getChannelData(channelIndex)

        for (let offset = start; offset < end; offset += 1) {
          peak = Math.max(peak, Math.abs(channelData[offset] ?? 0))
        }
      }

      return Math.min(1, Math.max(0.03, peak))
    })
  } catch {
    return []
  } finally {
    void audioContext.close()
  }
}

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return '00:00'
  }

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)

  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}

function formatBytes(bytes: number): string {
  if (!bytes) {
    return '0 KB'
  }

  const units = ['B', 'KB', 'MB', 'GB']
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** unitIndex

  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
}
