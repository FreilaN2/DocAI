/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "primary-container": "#ff6b00",
        "on-primary": "#ffffff",
        "background": "#fff8f6",
        "on-background": "#261812",
        "surface": "#fff8f6",
        "on-surface": "#261812",
        "surface-container-high": "#fee3d8",
        "surface-container-low": "#fff1eb",
        "surface-variant": "#f8ddd2",
        "primary": "#a04100",
        "outline": "#8e7164",
        "outline-variant": "#e2bfb0",
        "on-surface-variant": "#5a4136",
      },
      borderRadius: {
        "card": "24px",
        "btn": "12px"
      },
      fontFamily: {
        "body": ["Inter", "sans-serif"],
        "display": ["Inter", "sans-serif"],
      }
    },
  },
  plugins: [],
}
