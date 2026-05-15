import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import type { AppTheme } from '../../../shared/app-config'

type TranscribeProps = {
  theme: AppTheme
  onToggleTheme: () => void
}

const defaultApiUrl = import.meta.env.VITE_TRANSCRIPTION_API_URL ?? ''
const elevenLabsTranscriptionUrl = 'https://elevenlabs.io/es/audio-to-text'

export default function Transcribe({ theme, onToggleTheme }: TranscribeProps): React.JSX.Element {
  const [searchParams] = useSearchParams()
  const [apiUrl, setApiUrl] = useState(defaultApiUrl)
  const [audioPath, setAudioPath] = useState(searchParams.get('audioPath') ?? '')
  const [transcriptionText, setTranscriptionText] = useState('')
  const [rawResponse, setRawResponse] = useState('')
  const [statusMessage, setStatusMessage] = useState('Lista para enviar el audio extraído.')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const canSubmit = Boolean(apiUrl.trim() && audioPath.trim() && !isSubmitting)

  const transcribeAudio = async (): Promise<void> => {
    if (!canSubmit) {
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)
    setTranscriptionText('')
    setRawResponse('')
    setStatusMessage('Enviando audio a la API de transcripción...')

    try {
      const result = await window.transcription.transcribeAudio({
        apiUrl,
        audioPath
      })

      setTranscriptionText(result.text)
      setRawResponse(JSON.stringify(result.raw, null, 2))
      setStatusMessage('Transcripción completada.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo transcribir el audio.'
      setErrorMessage(message)
      setStatusMessage('La API devolvió un error o no respondió a tiempo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="app-shell theme-transition px-6 py-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="app-title mt-3 text-4xl font-medium">Transcribir audio</h1>
            <p className="app-muted mt-2 max-w-2xl text-sm">
              Envía el audio extraído a una API externa mediante Fetch y recibe el texto para
              revisarlo dentro de la app.
            </p>
          </div>
          <button
            type="button"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            onClick={onToggleTheme}
            className="theme-toggle h-11 w-11 shrink-0 rounded-full text-xl font-semibold"
          >
            {theme === 'dark' ? '☀' : '☾'}
          </button>
        </header>

        <nav className="mb-4 flex flex-wrap gap-2">
          <Link to="/" className="secondary-button rounded-xl border px-4 py-2 text-sm font-medium">
            Extractor
          </Link>
          <Link
            to="/transcribe"
            className="app-nav-active rounded-xl border px-4 py-2 text-sm font-medium"
          >
            Transcripción
          </Link>
          <Link
            to="/transcriptions"
            className="secondary-button rounded-xl border px-4 py-2 text-sm font-medium"
          >
            Biblioteca TXT
          </Link>
        </nav>

        <section className="app-panel space-y-4 rounded-3xl border p-5 shadow-[0_20px_60px_var(--shadow-color)]">
          <div className="app-card rounded-2xl border p-5">
            <p className="app-label text-sm font-semibold uppercase tracking-wide">Próximamente</p>
            <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="app-text max-w-2xl text-sm leading-6">
                Estamos trabajando en la experiencia de transcripción dentro de Aurea. Mientras
                tanto, puedes usar las transcripciones gratuitas de ElevenLabs desde este acceso
                directo.
              </p>
              <a
                href={elevenLabsTranscriptionUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex shrink-0 items-center justify-center rounded-xl bg-cyan-300 px-5 py-2 font-semibold text-slate-950 transition hover:bg-cyan-200"
              >
                Abrir ElevenLabs
              </a>
            </div>
          </div>

          <div className="app-card rounded-2xl border p-5">
            <div className="grid gap-4">
              <label className="grid gap-2">
                <span className="app-label text-sm font-semibold">URL de la API</span>
                <input
                  type="url"
                  value={apiUrl}
                  onChange={(event) => setApiUrl(event.target.value)}
                  placeholder="https://api.example.com/transcribe"
                  className="app-input rounded-xl border px-4 py-3 text-sm outline-none"
                />
              </label>

              <label className="grid gap-2">
                <span className="app-label text-sm font-semibold">Ruta del audio extraído</span>
                <input
                  type="text"
                  value={audioPath}
                  onChange={(event) => setAudioPath(event.target.value)}
                  placeholder="C:\\Users\\...\\audio.mp3"
                  className="app-input rounded-xl border px-4 py-3 text-sm outline-none"
                />
              </label>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={!canSubmit}
                  onClick={() => {
                    void transcribeAudio()
                  }}
                  className="rounded-xl bg-cyan-300 px-5 py-2 font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? 'Transcribiendo...' : 'Enviar a transcribir'}
                </button>
                <p className="app-muted text-sm">{statusMessage}</p>
              </div>
            </div>
          </div>

          {errorMessage ? (
            <div className="error-card rounded-2xl border p-4">
              <p className="text-sm font-semibold">Transcripción fallida</p>
              <p className="mt-1 text-sm">{errorMessage}</p>
            </div>
          ) : null}

          {transcriptionText || rawResponse ? (
            <div className="app-card rounded-2xl border p-5">
              <p className="app-label text-sm font-semibold uppercase tracking-wide">Resultado</p>
              {transcriptionText ? (
                <p className="app-text mt-3 whitespace-pre-wrap text-sm leading-6">
                  {transcriptionText}
                </p>
              ) : (
                <p className="app-muted mt-3 text-sm">
                  La API respondió sin un campo text/transcription/transcript. Revisa la respuesta
                  cruda.
                </p>
              )}

              {rawResponse ? (
                <pre className="app-raw-response mt-4 max-h-64 overflow-auto rounded-xl border p-4 text-xs">
                  {rawResponse}
                </pre>
              ) : null}
            </div>
          ) : null}
        </section>
      </div>
    </main>
  )
}
