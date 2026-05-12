import fs from 'fs'
import path from 'path'
import { spawnSync } from 'child_process'
import { app } from 'electron'

function getPackagedCandidates(): string[] {
  const binName = process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg'

  return [
    path.join(process.resourcesPath, 'ffmpeg', binName),
    path.join(process.resourcesPath, 'bin', binName),
    path.join(app.getAppPath(), 'resources', 'ffmpeg', binName),
    path.join(app.getAppPath(), 'resources', 'bin', binName)
  ]
}

function isRunnableBinary(command: string): boolean {
  const result = spawnSync(command, ['-version'], {
    windowsHide: true,
    stdio: 'ignore'
  })

  return !result.error && result.status === 0
}

export function resolveFfmpegBinary(): string {
  for (const candidate of getPackagedCandidates()) {
    if (fs.existsSync(candidate) && isRunnableBinary(candidate)) {
      return candidate
    }
  }

  if (isRunnableBinary('ffmpeg')) {
    return 'ffmpeg'
  }

  throw new Error(
    'FFmpeg binary not found. Install FFmpeg and ensure it is available on PATH, or package an FFmpeg binary with the app.'
  )
}

// TODO: Add platform-aware packaged binary resolution for production bundles.
