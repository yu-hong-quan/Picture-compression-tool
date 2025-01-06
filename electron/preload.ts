import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electron', {
  showSaveDialog: (options: any) => ipcRenderer.invoke('showSaveDialog', options),
  saveFile: (path: string, buffer: Buffer) => ipcRenderer.invoke('saveFile', path, buffer),
  windowMinimize: () => ipcRenderer.invoke('window-minimize'),
  windowMaximize: () => ipcRenderer.invoke('window-maximize'),
  windowClose: () => ipcRenderer.invoke('window-close')
}) 