import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'next/link': path.resolve(__dirname, './src/lib/next-link-shim.jsx'),
      'next/image': path.resolve(__dirname, './src/lib/next-image-shim.jsx'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: ['pkm.makroboi.site', 'pkmcenter.makroboi.site', 'localhost', '127.0.0.1'],
    watch: {
      usePolling: true,
      interval: 300,
    },
  },
})
