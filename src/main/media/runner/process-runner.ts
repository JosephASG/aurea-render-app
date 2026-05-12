import { spawn, type ChildProcessWithoutNullStreams } from 'child_process'

export type ProcessRunnerOptions = {
  command: string
  args: string[]
  cwd?: string
  onStdoutLine?: (line: string) => void
  onStderrLine?: (line: string) => void
}

export type RunningProcess = {
  cancel: () => void
  completion: Promise<void>
}

function emitLines(chunk: Buffer, carry: string, onLine?: (line: string) => void): string {
  if (!onLine) {
    return carry
  }

  const text = carry + chunk.toString('utf8')
  const lines = text.split(/\r?\n|\r/)
  const remainder = lines.pop() ?? ''

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed) {
      onLine(trimmed)
    }
  }

  return remainder
}

export class ProcessRunner {
  run(options: ProcessRunnerOptions): RunningProcess {
    const child = spawn(options.command, options.args, {
      cwd: options.cwd,
      shell: false,
      windowsHide: true
    })

    let stdoutCarry = ''
    let stderrCarry = ''

    const completion = new Promise<void>((resolve, reject) => {
      child.stdout.on('data', (chunk: Buffer) => {
        stdoutCarry = emitLines(chunk, stdoutCarry, options.onStdoutLine)
      })

      child.stderr.on('data', (chunk: Buffer) => {
        stderrCarry = emitLines(chunk, stderrCarry, options.onStderrLine)
      })

      child.on('error', (error) => {
        reject(new Error(`Failed to start process: ${error.message}`))
      })

      child.on('close', (code, signal) => {
        if (stdoutCarry.trim() && options.onStdoutLine) {
          options.onStdoutLine(stdoutCarry.trim())
        }

        if (stderrCarry.trim() && options.onStderrLine) {
          options.onStderrLine(stderrCarry.trim())
        }

        if (signal) {
          reject(new Error('Process cancelled'))
          return
        }

        if (code === 0) {
          resolve()
          return
        }

        reject(new Error(`Process exited with code ${code ?? 'unknown'}`))
      })
    })

    return {
      cancel: () => {
        killProcess(child)
      },
      completion
    }
  }
}

function killProcess(child: ChildProcessWithoutNullStreams): void {
  if (child.killed) {
    return
  }

  if (process.platform === 'win32') {
    child.kill('SIGTERM')
    setTimeout(() => {
      if (!child.killed) {
        child.kill('SIGKILL')
      }
    }, 700)
    return
  }

  child.kill('SIGTERM')
}
