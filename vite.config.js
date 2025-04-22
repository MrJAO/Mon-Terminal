// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import polyfillNode from 'rollup-plugin-polyfill-node'

export default defineConfig({
  define: {
    // so `global` & `process.env` aren’t undefined
    global: 'globalThis',
    'process.env': {},
  },
  resolve: {
    alias: {
      // point any Node core imports at browser polyfills
      process: 'process/browser',
      buffer: 'buffer',
    },
  },
  optimizeDeps: {
    // prebundle these
    include: ['process', 'buffer'],
  },
  build: {
    rollupOptions: {
      plugins: [
        // this brings in all the Node built‑in polyfills on build
        polyfillNode()
      ],
    },
  },
  plugins: [
    // Vite plugin chain: do React last so the polyfills are in place first
    react(),
  ],
  server: {
    host: 'localhost',
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://mon-terminal.onrender.com',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
