import { contextBridge, ipcRenderer } from 'electron'
import type { PipelineEvent } from '../main/pythonBridge'

const api = {
  selectCdxFile: (): Promise<string | null> =>
    ipcRenderer.invoke('select-cdx-file'),

  selectOutputFolder: (): Promise<string | null> =>
    ipcRenderer.invoke('select-output-folder'),

  openPath: (p: string): Promise<void> =>
    ipcRenderer.invoke('open-path', p),

  checkChemDraw: (): Promise<{ available: boolean; version?: string }> =>
    ipcRenderer.invoke('check-chemdraw'),

  startProcessing: (cdxPath: string, outputDir: string): Promise<void> =>
    ipcRenderer.invoke('start-processing', { cdxPath, outputDir }),

  cancelProcessing: (): Promise<void> =>
    ipcRenderer.invoke('cancel-processing'),

  onPipelineEvent: (callback: (event: PipelineEvent) => void): (() => void) => {
    const handler = (_: Electron.IpcRendererEvent, event: PipelineEvent): void => callback(event)
    ipcRenderer.on('pipeline-event', handler)
    return () => ipcRenderer.removeListener('pipeline-event', handler)
  }
}

contextBridge.exposeInMainWorld('api', api)

export type API = typeof api
