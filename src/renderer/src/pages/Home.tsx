import { Link } from 'react-router-dom'
import VideoDropzone from '../components/VideoDropzone'
import OutputSettings from '../components/OutputSettings'
import ExtractionOverlay from '../components/ExtractionOverlay'
import { useAudioExtractor } from '../hooks/useAudioExtractor'
import type { AppTheme } from '../../../shared/app-config'

type HomeProps = {
  theme: AppTheme
  onToggleTheme: () => void
}

export default function Home({ theme, onToggleTheme }: HomeProps): React.JSX.Element {
  const {
    selectedVideo,
    outputDirectory,
    selectedFormat,
    progress,
    statusMessage,
    resultPath,
    errorMessage,
    isRunning,
    selectVideo,
    setVideoFromPath,
    selectOutputDirectory,
    setFormat,
    startExtraction,
    cancelExtraction,
    openOutputLocation,
    closeResultOverlay
  } = useAudioExtractor()

  const canExtract = Boolean(selectedVideo && outputDirectory && !isRunning)
  const showExtractionOverlay = Boolean(isRunning || (progress !== null && !errorMessage))

  return (
    <main className="app-shell theme-transition px-6 py-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="app-title mt-3 text-4xl font-medium">Aurea Render</h1>
            <p className="app-muted mt-2 max-w-2xl text-sm">
              Extract clean, high-quality audio from video files with a secure job-based media
              engine.
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
          <Link to="/" className="app-nav-active rounded-xl border px-4 py-2 text-sm font-medium">
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
            className="secondary-button rounded-xl border px-4 py-2 text-sm font-medium"
          >
            Biblioteca TXT
          </Link>
        </nav>

        <div className="app-panel space-y-4 rounded-3xl border p-5 shadow-[0_20px_60px_var(--shadow-color)]">
          <VideoDropzone
            selectedVideo={selectedVideo}
            disabled={isRunning}
            onPickVideo={selectVideo}
            onVideoPathSelected={async (path) => {
              await setVideoFromPath(path)
            }}
          />

          <OutputSettings
            disabled={isRunning}
            selectedFormat={selectedFormat}
            outputDirectory={outputDirectory}
            onFormatChange={setFormat}
            onPickOutputDirectory={selectOutputDirectory}
          />

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={!canExtract}
              onClick={() => {
                void startExtraction()
              }}
              className="rounded-xl bg-emerald-400 px-5 py-2 font-semibold text-slate-900 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Extract audio
            </button>
            {resultPath ? (
              <Link
                to={`/transcribe?audioPath=${encodeURIComponent(resultPath)}`}
                className="secondary-button rounded-xl border px-5 py-2 font-semibold transition"
              >
                Transcribir audio
              </Link>
            ) : null}
          </div>

          {errorMessage && !showExtractionOverlay ? (
            <div className="error-card rounded-2xl border p-4">
              <p className="text-sm font-semibold">Extraction failed</p>
              <p className="mt-1 text-sm">{errorMessage}</p>
            </div>
          ) : null}
        </div>
      </div>

      <ExtractionOverlay
        progress={progress}
        statusMessage={statusMessage}
        resultPath={resultPath}
        isVisible={showExtractionOverlay}
        onCancel={cancelExtraction}
        onClose={closeResultOverlay}
        onOpenOutputLocation={openOutputLocation}
      />
    </main>
  )
}
