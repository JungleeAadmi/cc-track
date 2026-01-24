/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dark Blood Red Theme
        background: "#0a0404", // Almost black with red tint
        surface: "#1a0606",    // Dark blood card background
        
        primary: "#dc2626",    // Blood Red (Red-600)
        "primary-dark": "#991b1b", // Dried Blood (Red-800) for hovers
        
        secondary: "#522525",  // Muted reddish-brown
        muted: "#9ca3af",      // Neutral gray for text legibility
        
        success: "#15803d",    // Deep Green (remains for success states)
        warning: "#b45309",    // Deep Amber
        danger: "#ef4444",     // Bright Red
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}