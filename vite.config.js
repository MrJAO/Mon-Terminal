// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import rollupNodePolyFill from 'rollup-plugin-polyfill-node'

export default defineConfig({
  define: {
    // make `global` available
    global: 'window',
    // shim `process.env` if any libs reference it
    'process.env': {}
  },
  resolve: {
    alias: {
      // core node shims
      process: 'process/browser',
      buffer: 'buffer',
      util: 'rollup-plugin-node-polyfills/polyfills/util',
      stream: 'rollup-plugin-node-polyfills/polyfills/stream',
      events: 'rollup-plugin-node-polyfills/polyfills/events',
      path: 'rollup-plugin-node-polyfills/polyfills/path',
      crypto: 'rollup-plugin-node-polyfills/polyfills/crypto'
    }
  },
  optimizeDeps: {
    // force Vite to pre-bundle these
    include: ['process', 'buffer']
  },
  build: {
    rollupOptions: {
      plugins: [
        // polyfill any other core built‑ins during production build
        rollupNodePolyFill()
      ]
    }
  },
  plugins: [
    // polyfill at dev‑time too
    rollupNodePolyFill(),
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
