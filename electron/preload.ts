import { contextBridge, ipcRenderer } from 'electron'

// 定义 API 类型
type ElectronAPI = {
  showSaveDialog: (options: any) => Promise<any>
  saveFile: (path: string, buffer: Buffer) => Promise<void>
  windowMinimize: () => Promise<void>
  windowMaximize: () => Promise<void>
  windowClose: () => Promise<void>
  windowQuit: () => Promise<void>
}

// 创建 API 对象
const api: ElectronAPI = {
  showSaveDialog: (options) => ipcRenderer.invoke('showSaveDialog', options),
  saveFile: (path, buffer) => ipcRenderer.invoke('saveFile', path, buffer),
  windowMinimize: () => ipcRenderer.invoke('window-minimize'),
  windowMaximize: () => ipcRenderer.invoke('window-maximize'),
  windowClose: () => ipcRenderer.invoke('window-close'),
  windowQuit: () => ipcRenderer.invoke('window-quit')
}

// 暴露 API
contextBridge.exposeInMainWorld('electron', api)

// 导出类型
export type { ElectronAPI } 