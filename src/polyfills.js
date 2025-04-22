// src/polyfills.js
import process from 'process'
import { Buffer } from 'buffer'

// make Node‐isms available in browser
if (typeof window.global === 'undefined') {
  window.global = window
}
if (typeof window.process === 'undefined') {
  window.process = process
}
if (typeof window.Buffer === 'undefined') {
  window.Buffer = Buffer
}
