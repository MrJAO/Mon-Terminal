// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import rollupNodePolyFill from 'rollup-plugin-polyfill-node'

export default defineConfig({
  define: {
    // make `global` available in the browser
    global: 'window',
    // optional: shim process.env if any libs reference it
    'process.env': {}
  },
  resolve: {
    alias: {
      // polyfill Node.js core shims for process and buffer
      process: 'process/browser',
      buffer: 'buffer/'
    }
  },
  optimizeDeps: {
    // ensure these get pre-bundled during dev
    include: ['process', 'buffer']
  },
  build: {
    rollupOptions: {
      // polyfill other Node.js core modules for production build
      plugins: [
        rollupNodePolyFill()
      ]
    }
  },
  plugins: [
    react()
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
