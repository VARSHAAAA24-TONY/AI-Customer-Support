/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'saas-bg': '#0D0D0D',       // Matte Black
        'saas-surface': '#1A1A1A',  // Soft Dark Grey
        'saas-border': '#262626',   // Clean Border
        'saas-accent': '#C2A878',   // Elegant Gold
        'saas-primary': '#C2A878',  // Mapping Gold to Primary for ease
        'saas-secondary': '#A58B5E', // Muted Gold
        'saas-text': '#EAEAEA',     // Soft White
        'saas-text-muted': '#A3A3A3' // Muted Grey
      },
      fontFamily: {
        'sans': ['Inter', 'Outfit', 'sans-serif'],
      },
      borderRadius: {
        'saas': '0.75rem',
      },
      boxShadow: {
        'saas-soft': '0 8px 32px -4px rgba(0, 0, 0, 0.5)',
        'saas-gold': '0 0 20px -5px rgba(194, 168, 120, 0.2)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      }
    },
  },
  plugins: [],
}
