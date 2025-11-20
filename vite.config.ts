/// <reference types="vitest" />

import legacy from '@vitejs/plugin-legacy'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    legacy()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (!id.includes('node_modules')) {
            return undefined
          }

          if (id.includes('@ionic')) {
            return 'ionic'
          }

          if (id.includes('vue')) {
            return 'vue'
          }

          if (id.includes('leaflet')) {
            return 'leaflet'
          }

          if (id.includes('axios')) {
            return 'axios'
          }

          return 'vendor'
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom'
  }
})
