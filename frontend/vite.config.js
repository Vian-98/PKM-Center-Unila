import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Situs live memakai dev server Vite di balik Cloudflare. Tanpa header ini,
// berkas .css/.js di-cache browser 4 jam sehingga perubahan gaya tidak langsung
// terlihat (berkas .jsx sudah no-cache). no-store memaksa browser selalu ambil ulang.
const noStoreHeaders = {
  name: 'no-store-headers',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      // Vite memasang no-cache belakangan; kunci nilainya agar tetap no-store.
      const setHeader = res.setHeader.bind(res)
      res.setHeader = (name, value) =>
        setHeader(name, String(name).toLowerCase() === 'cache-control' ? 'no-store' : value)
      res.setHeader('Cache-Control', 'no-store')
      next()
    })
  },
}

export default defineConfig({
  plugins: [react(), noStoreHeaders],
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
    proxy: {
      '/api': {
        target: process.env.VITE_PROXY_TARGET || 'http://localhost:8081',
        changeOrigin: true,
      },
      '/uploads': {
        target: process.env.VITE_PROXY_TARGET || 'http://localhost:8081',
        changeOrigin: true,
      },
    },
    watch: {
      usePolling: true,
      interval: 300,
    },
  },
})
