import type { AudioFormat } from '../types/media'

const formatDescriptions: Record<AudioFormat, string> = {
  original: 'Fastest. Keeps the original audio track without re-encoding when possible.',
  mp3: 'Compatible and lightweight.',
  wav: 'Uncompressed audio. Large file size.',
  flac: 'Lossless compression.',
  aac: 'Good quality and compatible with M4A workflows.'
}

type OutputSettingsProps = {
  selectedFormat: AudioFormat
  outputDirectory: string | null
  onFormatChange: (format: AudioFormat) => void
  onPickOutputDirectory: () => Promise<void>
  disabled?: boolean
}

export default function OutputSettings({
  selectedFormat,
  outputDirectory,
  onFormatChange,
  onPickOutputDirectory,
  disabled = false
}: OutputSettingsProps): React.JSX.Element {
  return (
    <div className="app-card rounded-2xl border p-5">
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label className="app-label mb-2 block text-sm font-semibold uppercase tracking-wide">
            Output format
          </label>
          <select
            disabled={disabled}
            value={selectedFormat}
            onChange={(event) => onFormatChange(event.target.value as AudioFormat)}
            className="app-input w-full rounded-xl border px-3 py-2 outline-none transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="original">Original</option>
            <option value="mp3">MP3</option>
            <option value="wav">WAV</option>
            <option value="flac">FLAC</option>
            <option value="aac">AAC</option>
          </select>
          <p className="app-muted mt-2 text-sm">{formatDescriptions[selectedFormat]}</p>
        </div>

        <div>
          <label className="app-label mb-2 block text-sm font-semibold uppercase tracking-wide">
            Output directory
          </label>
          <div className="flex gap-3">
            <input
              value={outputDirectory ?? ''}
              readOnly
              placeholder="Choose where extracted audio will be saved"
              className="app-input w-full rounded-xl border px-3 py-2"
            />
            <button
              type="button"
              disabled={disabled}
              onClick={() => {
                void onPickOutputDirectory()
              }}
              className="secondary-button rounded-xl border px-4 py-2 font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              Browse
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
