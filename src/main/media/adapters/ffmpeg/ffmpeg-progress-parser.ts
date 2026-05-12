const durationRegex = /Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/
const timeRegex = /time=(\d+):(\d+):(\d+(?:\.\d+)?)/

function parseTimestampToSeconds(hours: string, minutes: string, seconds: string): number {
  return Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds)
}

export class FfmpegProgressParser {
  private durationSeconds: number | null = null

  parseLine(line: string): number | null {
    const durationMatch = line.match(durationRegex)
    if (durationMatch) {
      this.durationSeconds = parseTimestampToSeconds(
        durationMatch[1],
        durationMatch[2],
        durationMatch[3]
      )
      return null
    }

    const timeMatch = line.match(timeRegex)
    if (!timeMatch || !this.durationSeconds || this.durationSeconds <= 0) {
      return null
    }

    const currentSeconds = parseTimestampToSeconds(timeMatch[1], timeMatch[2], timeMatch[3])
    const ratio = currentSeconds / this.durationSeconds
    const bounded = Math.max(0, Math.min(1, ratio))
    return Math.round(bounded * 100)
  }
}

// TODO: Prefer ffprobe metadata for precise progress in a future iteration.
