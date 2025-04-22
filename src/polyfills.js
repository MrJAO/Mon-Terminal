// src/polyfills.js
import process from 'process'    // ← import by package name
import { Buffer } from 'buffer' // ← same here

// attach them to window
if (typeof window.global === 'undefined') {
  window.global = window
}
if (typeof window.process === 'undefined') {
  window.process = process
}
if (typeof window.Buffer === 'undefined') {
  window.Buffer = Buffer
}
