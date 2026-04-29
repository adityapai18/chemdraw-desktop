import { spawn, ChildProcess } from 'child_process'
import { join } from 'path'
import { app } from 'electron'
import { is } from '@electron-toolkit/utils'

export type PipelineEvent =
  | { type: 'stage'; stage: number; total: number; message: string }
  | { type: 'compound'; name: string; match: string; index: number; total: number }
  | { type: 'log'; level: 'info' | 'warn' | 'error'; message: string }
  | { type: 'result'; success: boolean; excelPath: string; compoundCount: number; outputDir: string }
  | { type: 'error'; message: string }
  | { type: 'chemdraw_status'; available: boolean; version?: string; progid?: string; reason?: string }

type EventCallback = (event: PipelineEvent) => void

export class PythonBridge {
  private proc: ChildProcess | null = null

  private getPythonExePath(): string {
    if (is.dev) {
      // In dev, use the local Python in the python/ folder venv or system Python
      return join(app.getAppPath(), '..', 'python', 'backend.py')
    }
    // In production, use the bundled PyInstaller executable
    return join(process.resourcesPath, 'python-dist', 'backend', 'backend.exe')
  }

  private spawnPython(args: string[] = []): ChildProcess {
    if (is.dev) {
      const script = this.getPythonExePath()
      return spawn('python', [script, ...args], {
        stdio: ['pipe', 'pipe', 'pipe'],
        windowsHide: true
      })
    } else {
      const exe = this.getPythonExePath()
      return spawn(exe, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        windowsHide: true
      })
    }
  }

  async checkChemDraw(): Promise<{ available: boolean; version?: string; progid?: string; reason?: string }> {
    return new Promise((resolve) => {
      const proc = this.spawnPython(['--check-chemdraw'])
      let output = ''
      let done = false

      const finish = (result: { available: boolean; version?: string; progid?: string; reason?: string }): void => {
        if (done) return
        done = true
        resolve(result)
      }

      proc.stdout?.on('data', (d) => (output += d.toString()))
      proc.on('close', () => {
        try {
          const result = JSON.parse(output.trim().split('\n').pop()!)
          finish({
            available: Boolean(result.available),
            version: result.version,
            progid: result.progid,
            reason: result.reason
          })
        } catch {
          finish({ available: false, reason: 'Could not parse ChemDraw check output from Python backend.' })
        }
      })
      proc.on('error', (err) => finish({ available: false, reason: err.message }))

      setTimeout(() => {
        proc.kill()
        finish({ available: false, reason: 'Timed out while checking ChemDraw availability.' })
      }, 8000)
    })
  }

  startProcessing(
    cdxPath: string,
    outputDir: string,
    onEvent: EventCallback
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.cancel()

      this.proc = this.spawnPython()

      let buffer = ''

      this.proc.stdout?.on('data', (chunk: Buffer) => {
        buffer += chunk.toString()
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''
        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed) continue
          try {
            const event: PipelineEvent = JSON.parse(trimmed)
            onEvent(event)
            if (event.type === 'result' || event.type === 'error') {
              if (event.type === 'result' && event.success) resolve()
              else reject(new Error(event.type === 'error' ? event.message : 'Pipeline failed'))
            }
          } catch {
            onEvent({ type: 'log', level: 'info', message: trimmed })
          }
        }
      })

      this.proc.stderr?.on('data', (chunk: Buffer) => {
        const text = chunk.toString().trim()
        if (text) onEvent({ type: 'log', level: 'warn', message: text })
      })

      this.proc.on('close', (code) => {
        if (code !== 0 && code !== null) {
          reject(new Error(`Python process exited with code ${code}`))
        }
      })

      this.proc.on('error', (err) => {
        reject(new Error(`Failed to start Python backend: ${err.message}`))
      })

      // Send the job command via stdin
      const cmd = JSON.stringify({ cmd: 'process', cdx_path: cdxPath, output_dir: outputDir })
      this.proc.stdin?.write(cmd + '\n')
      this.proc.stdin?.end()
    })
  }

  cancel(): void {
    if (this.proc) {
      this.proc.kill()
      this.proc = null
    }
  }
}
