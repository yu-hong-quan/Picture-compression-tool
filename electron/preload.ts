import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electron', {
  showSaveDialog: (options: any) => ipcRenderer.invoke('show-save-dialog', options),
  showOpenDialog: (options: any) => ipcRenderer.invoke('show-open-dialog', options),
  saveFile: (filePath: string, fileData: Blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const buffer = Buffer.from(reader.result as ArrayBuffer)
        ipcRenderer.invoke('save-file', filePath, buffer)
          .then(resolve)
          .catch(reject)
      }
      reader.onerror = reject
      reader.readAsArrayBuffer(fileData)
    })
  }
}) 