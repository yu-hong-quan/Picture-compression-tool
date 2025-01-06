import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import isDev from 'electron-is-dev'
import fs from 'fs/promises'

async function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    titleBarStyle: 'hidden',
    frame: false,
    title: '图片压缩工具',
    icon: join(__dirname, '../build/icon.png'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: join(__dirname, 'preload.js')
    }
  })

  if (isDev) {
    // 开发模式下等待 Vite 启动
    setTimeout(() => {
      win.loadURL('http://localhost:5173')
      win.webContents.openDevTools()
    }, 1000)
  } else {
    win.loadFile(join(__dirname, '../dist/index.html'))
  }

  // 处理窗口控制按钮事件
  ipcMain.handle('window-minimize', () => {
    win.minimize()
  })

  ipcMain.handle('window-maximize', () => {
    if (win.isMaximized()) {
      win.unmaximize()
    } else {
      win.maximize()
    }
  })

  ipcMain.handle('window-close', () => {
    win.close()
  })

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