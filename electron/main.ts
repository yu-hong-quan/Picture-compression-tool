import { app, BrowserWindow, ipcMain, dialog, Tray, Menu, nativeImage } from 'electron'
import { join } from 'path'
import isDev from 'electron-is-dev'
import fs from 'fs/promises'

let tray: Tray | null = null
let mainWindow: BrowserWindow | null = null
let loadingWindow: BrowserWindow | null = null
let isQuitting = false

// 创建系统托盘
const createTray = () => {
  const iconPath = isDev
    ? join(__dirname, '../build/icon-16.png')
    : join(process.resourcesPath, 'build/icon-16.png');

  try {
    const icon = nativeImage.createFromPath(iconPath);
    tray = new Tray(icon);
    
    const contextMenu = Menu.buildFromTemplate([
      {
        label: '显示主窗口',
        click: () => {
          mainWindow?.show();
        }
      },
      {
        label: '最小化到托盘',
        click: () => {
          mainWindow?.hide();
        }
      },
      { type: 'separator' },
      {
        label: '退出',
        click: () => {
          isQuitting = true;
          app.quit();
        }
      }
    ]);

    tray.setToolTip('图片压缩工具');
    tray.setContextMenu(contextMenu);

    // 点击托盘图标显示主窗口
    tray.on('click', () => {
      mainWindow?.show();
    });
  } catch (error) {
    console.error('Failed to create tray icon:', error);
  }
};

async function createLoadingWindow() {
  loadingWindow = new BrowserWindow({
    width: 300,
    height: 300,
    frame: false,
    skipTaskbar: true,
    transparent: true,
    resizable: false,
    webPreferences: {
      nodeIntegration: true
    }
  })

  loadingWindow.loadFile(join(__dirname, '../loading.html'))
  loadingWindow.center()
}

// 将所有 IPC 处理器移到一起
function registerIpcHandlers() {
  ipcMain.handle('window-minimize', () => {
    mainWindow?.hide()
  })

  ipcMain.handle('window-maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow?.unmaximize()
    } else {
      mainWindow?.maximize()
    }
  })

  ipcMain.handle('window-close', () => {
    mainWindow?.hide()
  })

  ipcMain.handle('window-quit', () => {
    try {
      isQuitting = true
      app.quit()
      return Promise.resolve()
    } catch (error) {
      return Promise.reject(error)
    }
  })

  // ... 其他 IPC 处理器
}

function getAssetPath(...paths: string[]) {
  if (isDev) {
    return join(__dirname, '..', ...paths)
  }
  return join(process.resourcesPath, ...paths)
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    titleBarStyle: 'hidden',
    frame: false,
    title: '图片压缩工具',
    icon: getAssetPath('build', 'icon.png'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: join(__dirname, 'preload.js'),
      webSecurity: true,
      sandbox: false
    }
  })

  // 隐藏默认菜单栏
  mainWindow.setMenu(null)

  // 创建自定义菜单
  const template = [
    {
      label: '文件',
      submenu: [
        {
          label: '导入图片',
          accelerator: 'CmdOrCtrl+O',
          click: () => mainWindow?.webContents.send('import-images')
        },
        { type: 'separator' },
        {
          label: '退出',
          accelerator: 'CmdOrCtrl+Q',
          click: () => app.quit()
        }
      ]
    },
    {
      label: '编辑',
      submenu: [
        { role: 'undo', label: '撤销' },
        { role: 'redo', label: '重做' },
        { type: 'separator' },
        { role: 'cut', label: '剪切' },
        { role: 'copy', label: '复制' },
        { role: 'paste', label: '粘贴' },
        { role: 'delete', label: '删除' },
        { role: 'selectAll', label: '全选' }
      ]
    },
    {
      label: '视图',
      submenu: [
        { role: 'reload', label: '重新加载' },
        { role: 'forceReload', label: '强制重新加载' },
        { role: 'toggleDevTools', label: '开发者工具' },
        { type: 'separator' },
        { role: 'resetZoom', label: '实际大小' },
        { role: 'zoomIn', label: '放大' },
        { role: 'zoomOut', label: '缩小' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: '全屏' }
      ]
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '关于',
          click: () => {
            dialog.showMessageBox(mainWindow!, {
              title: '关于',
              message: '图片压缩工具',
              detail: '版本 1.0.0\n一个简单的图片压缩工具'
            })
          }
        }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)

  // 优化窗口加载
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  // 优化加载逻辑
  if (isDev) {
    mainWindow?.webContents.session.clearCache()
    await mainWindow?.loadURL('http://localhost:5173')
    mainWindow?.webContents.openDevTools()
  } else {
    // 生产环境加载
    try {
      const indexPath = join(__dirname, '../dist/index.html')
      await mainWindow?.loadFile(indexPath)
    } catch (error) {
      console.error('加载主窗口失败:', error)
      dialog.showErrorBox('错误', '应用加载失败，请重新安装')
      app.quit()
    }
  }

  // 窗口最小化时隐藏到托盘
  mainWindow.on('minimize', (event: Event) => {
    event.preventDefault()
    mainWindow?.hide()
  })

  // 注册所有 IPC 处理器
  registerIpcHandlers()

  // 处理文件保存对话框
  ipcMain.handle('showSaveDialog', async (_, options) => {
    return dialog.showSaveDialog(mainWindow!, options)
  })

  // 处理文件夹选择对话框
  ipcMain.handle('showOpenDialog', async (_, options) => {
    return dialog.showOpenDialog(mainWindow!, options)
  })

  // 处理文件保存
  ipcMain.handle('saveFile', async (_, path, buffer) => {
    await fs.writeFile(path, buffer)
  })

  // 主窗口加载完成后显示
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow?.show()
    loadingWindow?.close()
    loadingWindow = null
  })

  // 修改窗口关闭事件处理
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault()
      mainWindow?.hide()
    }
  })

  // 添加错误处理
  mainWindow?.webContents.on('crashed', () => {
    dialog.showErrorBox('错误', '应用崩溃，请重启')
    app.relaunch()
    app.quit()
  })

  // 处理未捕获的异常
  process.on('uncaughtException', (error) => {
    console.error('未捕获的异常:', error)
    dialog.showErrorBox('错误', '发生未知错误，请重启应用')
    app.relaunch()
    app.quit()
  })
}

app.whenReady().then(() => {
  createLoadingWindow()
  createWindow()
  createTray()
})

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

// 退出前清理
app.on('before-quit', () => {
  isQuitting = true
  tray?.destroy()
}) 