// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import rollupNodePolyFill from 'rollup-plugin-node-polyfills'
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill'
import { NodeModulesPolyfillPlugin } from '@esbuild-plugins/node-modules-polyfill'

export default defineConfig({
  define: {
    // make globalThis available as global
    global: 'globalThis',
    // (optional) shim process.env
    'process.env': {}
  },
  resolve: {
    alias: {
      // force Vite to use your real React package
      react: path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
      'react/jsx-runtime': path.resolve(__dirname, 'node_modules/react/jsx-runtime'),
      'react/jsx-dev-runtime': path.resolve(__dirname, 'node_modules/react/jsx-dev-runtime'),
      // Node.js core modules → browser polyfills
      process: 'process/browser',
      buffer: 'buffer',
      stream: 'stream-browserify',
      crypto: 'crypto-browserify',
      os: 'os-browserify',
      path: 'path-browserify',
      assert: 'assert'
    }
  },
  optimizeDeps: {
    include: [
      // pre-bundle these so their imports resolve correctly
      'react',
      'react/jsx-runtime',
      'wagmi',
      '@wagmi/core',
      'ethers',
      'buffer',
      'process/browser',
      'stream-browserify',
      'crypto-browserify',
      'os-browserify',
      'path-browserify',
      'assert'
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
      // make sure any CJS wagmi/ethers code gets transformed
      include: [/node_modules/]
    },
    rollupOptions: {
      // extra polyfills at bundle time
      plugins: [rollupNodePolyFill()]
    }
  },
  plugins: [react()],
  server: {
    host: 'localhost',
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://mon-terminal-production.up.railway.app',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
