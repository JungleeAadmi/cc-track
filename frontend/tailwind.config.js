/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // You can add custom colors here if needed, 
      // but we are currently using standard Tailwind colors (red-900, neutral-950)
    },
  },
  plugins: [],
}