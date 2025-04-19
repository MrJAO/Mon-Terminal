/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
      extend: {
        fontFamily: {
          pixel: ["'Press Start 2P'", "cursive"],
        },
        colors: {
          cyberdark: "#1a001f",
          cyberlight: "#7d00b0",
          neon: "#c200fb",
        },
      },
    },
    plugins: [],
  }
  