interface ElectronAPI {
  showSaveDialog: (options: any) => Promise<{ canceled: boolean; filePath?: string }>
  showOpenDialog: (options: any) => Promise<{ canceled: boolean; filePaths: string[] }>
  saveFile: (filePath: string, fileData: Blob) => Promise<void>
}

declare interface Window {
  electron: ElectronAPI
} 