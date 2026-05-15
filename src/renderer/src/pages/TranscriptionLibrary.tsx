import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FaRegCopy, FaRegFolderOpen, FaRegFileLines } from 'react-icons/fa6'
import type { AppTheme } from '../../../shared/app-config'
import type { SavedTranscription } from '../../../shared/transcription-library'

type LibraryTab = 'create' | 'files' | 'preview'

type TranscriptionLibraryProps = {
  theme: AppTheme
  onToggleTheme: () => void
}

export default function TranscriptionLibrary({
  theme,
  onToggleTheme
}: TranscriptionLibraryProps): React.JSX.Element {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [transcriptions, setTranscriptions] = useState<SavedTranscription[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState(
    'Pega una transcripción para guardarla como TXT.'
  )
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<LibraryTab>('create')

  const selectedTranscription =
    transcriptions.find((transcription) => transcription.id === selectedId) ??
    transcriptions[0] ??
    null

  useEffect(() => {
    const loadTranscriptions = async (): Promise<void> => {
      try {
        const savedTranscriptions = await window.transcriptionLibrary.list()
        setTranscriptions(savedTranscriptions)

        if (savedTranscriptions[0]) {
          setSelectedId(savedTranscriptions[0].id)
        }
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : 'No se pudieron cargar las transcripciones.'
        )
      }
    }

    void loadTranscriptions()
  }, [])

  const saveTranscription = async (): Promise<void> => {
    if (!title.trim() || !content.trim() || isSaving) {
      setErrorMessage('Agrega un título y pega la transcripción antes de guardar.')
      return
    }

    setIsSaving(true)
    setErrorMessage(null)
    setStatusMessage('Guardando transcripción...')

    try {
      const savedTranscription = await window.transcriptionLibrary.save({ title, content })
      setTranscriptions((current) => [
        savedTranscription,
        ...current.filter((transcription) => transcription.id !== savedTranscription.id)
      ])
      setSelectedId(savedTranscription.id)
      setActiveTab('preview')
      setTitle('')
      setContent('')
      setStatusMessage(`Guardada como ${savedTranscription.fileName}`)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo guardar el archivo TXT.')
      setStatusMessage('No se pudo guardar la transcripción.')
    } finally {
      setIsSaving(false)
    }
  }

  const copySelectedTranscription = async (): Promise<void> => {
    if (!selectedTranscription) {
      return
    }

    try {
      await navigator.clipboard.writeText(selectedTranscription.content)
      setStatusMessage('Transcripción copiada al portapapeles.')
    } catch {
      setErrorMessage('No se pudo copiar la transcripción.')
    }
  }

  const openSelectedLocation = async (): Promise<void> => {
    if (!selectedTranscription) {
      return
    }

    await window.transcriptionLibrary.openLocation(selectedTranscription.path)
  }

  return (
    <main className="app-shell theme-transition px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="app-title mt-3 text-4xl font-medium">Transcripciones</h1>
            <p className="app-muted mt-2 max-w-2xl text-sm">
              Guarda manualmente textos de ElevenLabs como archivos TXT, revísalos dentro de Aurea y
              cópialos cuando los necesites.
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
            className="secondary-button rounded-xl border px-4 py-2 text-sm font-medium"
          >
            Transcripción
          </Link>
          <Link
            to="/transcriptions"
            className="app-nav-active rounded-xl border px-4 py-2 text-sm font-medium"
          >
            Biblioteca TXT
          </Link>
        </nav>

        <section className="app-panel rounded-3xl border p-5 shadow-[0_20px_60px_var(--shadow-color)]">
          <div className="transcription-tabs mb-5 flex flex-wrap gap-2 rounded-3xl border p-2">
            <TabButton
              label="Agregar"
              isActive={activeTab === 'create'}
              onClick={() => setActiveTab('create')}
            />
            <TabButton
              label={`Archivos (${transcriptions.length})`}
              isActive={activeTab === 'files'}
              onClick={() => setActiveTab('files')}
            />
            <TabButton
              label="Preview"
              isActive={activeTab === 'preview'}
              onClick={() => setActiveTab('preview')}
            />
          </div>

          {activeTab === 'create' ? (
            <div className="app-card rounded-2xl border p-5">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <p className="app-label text-sm font-semibold">Nueva transcripción</p>
                  <p className="app-muted mt-1 text-xs">
                    El título se convierte en el nombre del TXT.
                  </p>
                </div>
                <FaRegFileLines className="app-muted text-xl" aria-hidden="true" />
              </div>

              <div className="grid gap-4">
                <label className="grid gap-2">
                  <span className="app-label text-sm font-semibold">Título</span>
                  <input
                    type="text"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Ej. Episodio 01 Introducción"
                    className="app-input rounded-2xl border px-4 py-3 text-sm outline-none"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="app-label text-sm font-semibold">Texto de la transcripción</span>
                  <textarea
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                    placeholder="Pega aquí el texto que copiaste desde ElevenLabs..."
                    className="app-input max-h-[24rem] min-h-72 resize-y overflow-auto rounded-2xl border px-4 py-3 text-sm leading-6 outline-none"
                  />
                </label>

                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => {
                    void saveTranscription()
                  }}
                  className="h-14 rounded-3xl bg-cyan-300 px-5 text-base font-medium text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? 'Guardando...' : 'Guardar TXT'}
                </button>
              </div>
            </div>
          ) : null}

          {activeTab === 'files' ? (
            <div className="app-card rounded-2xl border p-5">
              <div className="mb-4">
                <p className="app-label text-sm font-semibold">Archivos guardados</p>
                <p className="app-muted mt-1 text-xs">
                  {transcriptions.length} TXT en la biblioteca. Selecciona uno para verlo en
                  preview.
                </p>
              </div>

              <div className="grid max-h-[34rem] gap-2 overflow-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
                {transcriptions.length ? (
                  transcriptions.map((transcription) => {
                    const isSelected = transcription.id === selectedTranscription?.id

                    return (
                      <button
                        type="button"
                        key={transcription.id}
                        onClick={() => {
                          setSelectedId(transcription.id)
                          setActiveTab('preview')
                        }}
                        className={`transcription-list-item rounded-2xl border p-3 text-left transition ${
                          isSelected ? 'transcription-list-item-active' : ''
                        }`}
                      >
                        <span className="block truncate text-sm font-semibold">
                          {transcription.title}
                        </span>
                        <span className="app-muted mt-1 block truncate text-xs">
                          {transcription.fileName}
                        </span>
                        <span className="app-muted mt-2 block text-[11px]">
                          {formatDate(transcription.updatedAt)} ·{' '}
                          {formatBytes(transcription.sizeBytes)}
                        </span>
                      </button>
                    )
                  })
                ) : (
                  <div className="app-muted rounded-2xl border border-dashed border-white/10 p-4 text-sm">
                    Todavía no hay transcripciones guardadas.
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {activeTab === 'preview' ? (
            <article className="app-card rounded-2xl border p-5">
              {selectedTranscription ? (
                <>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h2 className="app-title truncate text-2xl font-medium">
                        {selectedTranscription.title}
                      </h2>
                      <p className="app-muted mt-1 break-all text-xs">
                        {selectedTranscription.path}
                      </p>
                    </div>

                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          void copySelectedTranscription()
                        }}
                        className="secondary-button inline-flex h-11 items-center gap-2 rounded-2xl border px-4 text-sm font-medium transition"
                      >
                        <FaRegCopy aria-hidden="true" />
                        Copiar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          void openSelectedLocation()
                        }}
                        className="secondary-button inline-flex h-11 items-center gap-2 rounded-2xl border px-4 text-sm font-medium transition"
                      >
                        <FaRegFolderOpen aria-hidden="true" />
                        Ruta
                      </button>
                    </div>
                  </div>

                  <pre className="transcription-preview mt-5 max-h-[30rem] overflow-auto whitespace-pre-wrap rounded-3xl border p-5 text-sm leading-7">
                    {selectedTranscription.content}
                  </pre>
                </>
              ) : (
                <div className="grid min-h-[20rem] place-items-center text-center">
                  <div>
                    <FaRegFileLines
                      className="app-muted mx-auto mb-4 text-4xl"
                      aria-hidden="true"
                    />
                    <p className="app-title text-lg font-medium">Sin transcripciones</p>
                    <p className="app-muted mt-2 max-w-sm text-sm">
                      Guarda tu primer TXT para ver el preview y copiarlo desde aquí.
                    </p>
                  </div>
                </div>
              )}
            </article>
          ) : null}

          <div className="mt-4 min-h-5">
            {errorMessage ? (
              <p className="text-sm text-rose-300">{errorMessage}</p>
            ) : (
              <p className="app-muted text-sm">{statusMessage}</p>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}

function TabButton({
  label,
  isActive,
  onClick
}: {
  label: string
  isActive: boolean
  onClick: () => void
}): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`transcription-tab rounded-2xl px-4 py-2 text-sm font-medium transition ${
        isActive ? 'transcription-tab-active' : ''
      }`}
    >
      {label}
    </button>
  )
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('es', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value))
}

function formatBytes(bytes: number): string {
  if (!bytes) {
    return '0 KB'
  }

  const units = ['B', 'KB', 'MB']
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** unitIndex

  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
}
