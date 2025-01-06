interface ElectronAPI {
  showSaveDialog: (options: any) => Promise<{ canceled: boolean; filePath?: string }>
  showOpenDialog: (options: any) => Promise<{ canceled: boolean; filePaths: string[] }>
  saveFile: (filePath: string, fileData: Blob) => Promise<void>
  windowMinimize: () => Promise<void>
  windowMaximize: () => Promise<void>
  windowClose: () => Promise<void>
}

declare interface Window {
  electron: ElectronAPI
} 