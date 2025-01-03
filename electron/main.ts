import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import isDev from 'electron-is-dev'
import fs from 'fs/promises'

async function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: join(__dirname, 'preload.js')
    }
  })

  if (isDev) {
    win.loadURL('http://localhost:5173')
    win.webContents.openDevTools()
  } else {
    win.loadFile(join(__dirname, '../dist/index.html'))
  }

  // 处理文件保存对话框
  ipcMain.handle('showSaveDialog', async (_, options) => {
    return dialog.showSaveDialog(win, options)
  })

  // 处理文件夹选择对话框
  ipcMain.handle('showOpenDialog', async (_, options) => {
    return dialog.showOpenDialog(win, options)
  })

  // 处理文件保存
  ipcMain.handle('saveFile', async (_, path, buffer) => {
    await fs.writeFile(path, buffer)
  })
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
}) 