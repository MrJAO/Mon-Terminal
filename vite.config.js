// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import rollupNodePolyFill from 'rollup-plugin-polyfill-node'
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill'
import { NodeModulesPolyfillPlugin } from '@esbuild-plugins/node-modules-polyfill'

export default defineConfig({
  define: {
    global: 'globalThis',
    'process.env': {}
  },
  resolve: {
    alias: {
      // force Vite to use React’s actual ESM entrypoints
      react: path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
      'react/jsx-runtime': path.resolve(__dirname, 'node_modules/react/jsx-runtime'),
      'react/jsx-dev-runtime': path.resolve(__dirname, 'node_modules/react/jsx-dev-runtime'),
      // your existing polyfills
      process: 'process/browser',
      buffer: 'buffer'
    }
  },
  optimizeDeps: {
    // pre‑bundle React and Wagmi so hooks & ESM imports resolve correctly
    include: [
      'react',
      'react/jsx-runtime',
      'wagmi',
      '@wagmi/core'
    ],
    esbuildOptions: {
      plugins: [
        NodeGlobalsPolyfillPlugin({ process: true, buffer: true }),
        NodeModulesPolyfillPlugin()
      ]
    }
  },
  build: {
    commonjsOptions: {
      // make sure Vite runs Wagmi’s CJS fallback through the CJS plugin
      include: [/node_modules/]
    },
    rollupOptions: {
      plugins: [
        rollupNodePolyFill()
      ]
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
