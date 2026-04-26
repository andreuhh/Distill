import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Proxy /api -> FastAPI su localhost:8000, cosi' in dev non abbiamo problemi CORS
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
