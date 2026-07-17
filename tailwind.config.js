/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6D5DF6',
          hover: '#5A4CE3',
        },
        secondary: '#8B7BFF',
        background: '#FAFBFF',
        card: 'rgba(255, 255, 255, 0.85)',
        muted: {
          DEFAULT: '#6B7280',
          light: '#9CA3AF'
        },
        dark: {
          bg: '#0F172A',
          card: 'rgba(30, 41, 59, 0.85)',
          text: '#F1F5F9'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        'xl': '18px',
        '2xl': '20px',
        '3xl': '28px',
      },
      boxShadow: {
        'glass': '0 20px 50px rgba(109, 93, 246, 0.12)',
        'glass-dark': '0 20px 50px rgba(0, 0, 0, 0.3)',
      }
    },
  },
  plugins: [],
  darkMode: ['class', '[data-theme="dark"]'],
}
