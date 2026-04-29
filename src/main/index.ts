import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import { PythonBridge } from './pythonBridge'

let mainWindow: BrowserWindow | null = null
let bridge: PythonBridge | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 780,
    minWidth: 900,
    minHeight: 640,
    show: false,
    autoHideMenuBar: true,
    titleBarStyle: 'default',
    backgroundColor: '#0f1117',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow!.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  bridge = new PythonBridge()

  // --- File / folder pickers ---
  ipcMain.handle('select-cdx-file', async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      title: 'Select ChemDraw File',
      filters: [{ name: 'ChemDraw Files', extensions: ['cdx'] }],
      properties: ['openFile']
    })
    return result.canceled ? null : result.filePaths[0]
  })

  ipcMain.handle('select-output-folder', async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      title: 'Select Output Folder',
      properties: ['openDirectory', 'createDirectory']
    })
    return result.canceled ? null : result.filePaths[0]
  })

  // --- Open paths in OS explorer/finder ---
  ipcMain.handle('open-path', async (_event, p: string) => {
    await shell.openPath(p)
  })

  // --- Check ChemDraw installation ---
  ipcMain.handle('check-chemdraw', async () => {
    return bridge!.checkChemDraw()
  })

  // --- Start processing pipeline ---
  ipcMain.handle('start-processing', async (_event, payload: { cdxPath: string; outputDir: string }) => {
    return bridge!.startProcessing(payload.cdxPath, payload.outputDir, (msg) => {
      mainWindow?.webContents.send('pipeline-event', msg)
    })
  })

  // --- Cancel running pipeline ---
  ipcMain.handle('cancel-processing', async () => {
    bridge!.cancel()
  })

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  bridge?.cancel()
  if (process.platform !== 'darwin') app.quit()
})
