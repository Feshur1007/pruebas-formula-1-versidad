import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // Las peticiones a /api van al servidor local que guarda la clave.
    proxy: { '/api': 'http://127.0.0.1:3001' },
  },
})
