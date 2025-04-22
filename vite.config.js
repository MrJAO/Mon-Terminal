// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import rollupNodePolyFill from 'rollup-plugin-polyfill-node'

export default defineConfig({
  define: {
    // make `global` available
    global: 'window',
    // shim process.env if you need it
    'process.env': {}
  },
  resolve: {
    alias: {
      // polyfill Node globals
      process: 'process/browser',  // ← point at the browser entry
      buffer: 'buffer'             // ← point at the main entry
    }
  },
  optimizeDeps: {
    // ensure these get pre-bundled so our aliases apply
    include: ['process', 'buffer']
  },
  build: {
    rollupOptions: {
      // polyfill other Node.js core modules
      plugins: [rollupNodePolyFill()]
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
