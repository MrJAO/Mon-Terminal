// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import rollupNodePolyFill from 'rollup-plugin-polyfill-node'

export default defineConfig({
  define: {
    // make `global` available
    global: 'window',
    // (optional) shim process.env
    'process.env': {}
  },
  resolve: {
    alias: {
      // polyfill process and buffer
      process: 'process/browser',
      buffer: 'buffer/'
    }
  },
  optimizeDeps: {
    // ensure these deps get pre-bundled
    include: ['process', 'buffer']
  },
  build: {
    rollupOptions: {
      // polyfill other Node.js core modules if needed
      plugins: [ rollupNodePolyFill() ]
    }
  },
  plugins: [react()],
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
