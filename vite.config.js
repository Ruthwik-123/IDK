import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true, // 0.0.0.0 — required for the sandboxed live preview
    port: 5173,
    strictPort: true,
    allowedHosts: true, // accept the preview proxy's dynamic host
  },
})
