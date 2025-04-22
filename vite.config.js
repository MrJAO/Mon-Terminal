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
      // point `process` imports at the browser entry
      process: 'process/browser.js',
      // point `buffer` imports at its main entry
      buffer: 'buffer/index.js'
    }
  },
  optimizeDeps: {
    // force Vite to pre-bundle these so our aliases apply
    include: ['process/browser', 'buffer']
  },
  build: {
    rollupOptions: {
      // polyfill other Node.js core modules as needed
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
