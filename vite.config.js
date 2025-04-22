// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import rollupNodePolyFill from 'rollup-plugin-polyfill-node'
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill'
import { NodeModulesPolyfillPlugin } from '@esbuild-plugins/node-modules-polyfill'

export default defineConfig({
  define: {
    // replace global with globalThis
    global: 'globalThis',
    'process.env': {}
  },
  resolve: {
    alias: {
      // use the browser versions of these
      process: 'process/browser',
      buffer: 'buffer',
      stream: 'stream-browserify'
    }
  },
  optimizeDeps: {
    esbuildOptions: {
      // shim process & Buffer in dev
      plugins: [
        NodeGlobalsPolyfillPlugin({ process: true, buffer: true }),
        NodeModulesPolyfillPlugin()
      ],
      define: {
        global: 'globalThis'
      }
    }
  },
  build: {
    rollupOptions: {
      plugins: [
        // polyfill Node core modules in the production bundle
        rollupNodePolyFill()
      ]
    },
    commonjsOptions: {
      transformMixedEsModules: true
    }
  },
  plugins: [
    // also apply at dev time
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
        secure: false
      }
    }
  }
})
