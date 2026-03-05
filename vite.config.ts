import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/wishes': 'http://localhost:3001',
      '/wish-logs': 'http://localhost:3001',
      '/request-logs': 'http://localhost:3001',
      '/artsearch': 'http://localhost:3001',
      '/humorapi': 'http://localhost:3001',
      '/quotas': 'http://localhost:3001',
    },
  },
})
