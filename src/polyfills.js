// src/polyfills.js
import process from 'process/browser'
import { Buffer } from 'buffer'

// ensure globalThis exists everywhere
if (typeof globalThis.global === 'undefined') {
  globalThis.global = globalThis
}

// polyfill process and Buffer
if (typeof globalThis.process === 'undefined') {
  globalThis.process = process
}
if (typeof globalThis.Buffer === 'undefined') {
  globalThis.Buffer = Buffer
}
