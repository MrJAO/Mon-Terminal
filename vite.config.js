// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import rollupNodePolyFill from 'rollup-plugin-node-polyfills'
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill'
import { NodeModulesPolyfillPlugin } from '@esbuild-plugins/node-modules-polyfill'

export default defineConfig({
  define: {
    // Make `global` and `process.env` available
    global: 'globalThis',
    'process.env': {},
  },
  resolve: {
    alias: {
      // These aliases point imports of Node core modules at our polyfills
      process: 'process/browser',
      buffer: 'buffer',
      util: 'rollup-plugin-node-polyfills/polyfills/util',
      stream: 'rollup-plugin-node-polyfills/polyfills/stream',
      events: 'rollup-plugin-node-polyfills/polyfills/events',
      path: 'rollup-plugin-node-polyfills/polyfills/path',
      crypto: 'rollup-plugin-node-polyfills/polyfills/crypto',
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      // Inject the esbuild polyfills at dev‑time
      define: { global: 'globalThis' },
      plugins: [
        NodeGlobalsPolyfillPlugin({ process: true, buffer: true }),
        NodeModulesPolyfillPlugin(),
      ],
    },
  },
  build: {
    rollupOptions: {
      plugins: [
        // And again for the production build
        rollupNodePolyFill(),
      ],
    },
  },
  plugins: [
    // Rollup polyfills need to run *before* React plugin
    rollupNodePolyFill(),
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
