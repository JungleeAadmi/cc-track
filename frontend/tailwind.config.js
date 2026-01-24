/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0f172a", // Dark Slate
        surface: "#1e293b",    // Lighter Slate (Card)
        primary: "#2563eb",    // Blue
        secondary: "#64748b",  // Slate 500
        success: "#16a34a",
        warning: "#eab308",
        danger: "#dc2626",
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}