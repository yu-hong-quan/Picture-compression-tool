import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import path from 'path'
import isDev from 'electron-is-dev'
import fs from 'fs/promises'

function createWindow() {
  const win = new BrowserWindow({
    width: 1024,
    height: 768,
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    vibrancy: 'under-window',
    visualEffectState: 'active',
    trafficLightPosition: { x: 10, y: 10 },
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  if (isDev) {
    win.loadURL('http://localhost:5173')
    win.webContents.openDevTools()
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  return win
}

app.whenReady().then(() => {
  const win = createWindow()

  // 处理文件保存对话框
  ipcMain.handle('show-save-dialog', (event, options) => {
    return dialog.showSaveDialog(win, options)
  })

  // 处理文件夹选择对话框
  ipcMain.handle('show-open-dialog', (event, options) => {
    return dialog.showOpenDialog(win, options)
  })

  // 处理文件保存
  ipcMain.handle('save-file', async (event, filePath, fileData) => {
    await fs.writeFile(filePath, fileData)
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
}) 