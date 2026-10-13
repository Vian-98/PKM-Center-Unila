import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: ['pkm.makroboi.site', 'pkmcenter.makroboi.site', 'localhost', '127.0.0.1'],
  }
})
