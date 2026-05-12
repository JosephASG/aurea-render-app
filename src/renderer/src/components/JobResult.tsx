type JobResultProps = {
  outputPath: string | null
  errorMessage: string | null
}

export default function JobResult({
  outputPath,
  errorMessage
}: JobResultProps): React.JSX.Element | null {
  if (!outputPath && !errorMessage) {
    return null
  }

  if (errorMessage) {
    return (
      <div className="error-card rounded-2xl border p-4">
        <p className="text-sm font-semibold">Extraction failed</p>
        <p className="mt-1 text-sm">{errorMessage}</p>
      </div>
    )
  }

  return (
    <div className="success-card rounded-2xl border p-4">
      <p className="text-sm font-semibold">Audio extracted successfully</p>
      <p className="mt-1 break-all text-sm">{outputPath}</p>
    </div>
  )
}
