import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'

export default defineConfig({
  plugins: [
    vue(),
    electron({
      entry: [
        'electron/main.ts',
        'electron/preload.ts'
      ]
    }),
    renderer()
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  },
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
}) 