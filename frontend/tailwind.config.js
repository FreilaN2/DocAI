/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "primary-container": "var(--primary-container)",
        "on-primary": "var(--on-primary)",
        "background": "var(--background)",
        "on-background": "var(--on-background)",
        "surface": "var(--surface)",
        "on-surface": "var(--on-surface)",
        "surface-container-high": "var(--surface-container-high)",
        "surface-container-low": "var(--surface-container-low)",
        "surface-variant": "var(--surface-variant)",
        "primary": "var(--primary)",
        "outline": "var(--outline)",
        "outline-variant": "var(--outline-variant)",
        "on-surface-variant": "var(--on-surface-variant)",
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
