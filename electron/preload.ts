import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electron', {
  showSaveDialog: (options: any) => ipcRenderer.invoke('showSaveDialog', options),
  saveFile: (path: string, buffer: Buffer) => ipcRenderer.invoke('saveFile', path, buffer)
}) 