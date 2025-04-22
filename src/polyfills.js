// src/polyfills.js
import process from 'process/browser.js'
import { Buffer } from 'buffer'

if (typeof window.global === 'undefined') {
  window.global = window
}
if (typeof window.process === 'undefined') {
  window.process = process
}
if (typeof window.Buffer === 'undefined') {
  window.Buffer = Buffer
}
