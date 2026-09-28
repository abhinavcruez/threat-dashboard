/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        crowdsec: {
          dark: '#0a0a0a',
          card: '#141414',
          accent: '#ef4444', // red for alerts
        }
      }
    },
  },
  plugins: [],
}
