/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Open Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        accent: {
          50: '#fdf4ff',
          100: '#fae8ff',
          200: '#f5d0fe',
          300: '#f0abfc',
          400: '#e879f9',
          500: '#d946ef',
          600: '#c026d3',
          700: '#a21caf',
          800: '#86198f',
          900: '#701a75',
        }
      },
      keyframes: {
        shine: {
          '0%': { transform: 'translateY(-100%) skewY(-12deg)', opacity: '0' },
          '2%': { transform: 'translateY(-80%) skewY(-12deg)', opacity: '0.6' },
          '8%': { transform: 'translateY(120%) skewY(-12deg)', opacity: '0' },
          '10%': { transform: 'translateY(-100%) skewY(-12deg)', opacity: '0' },
          '25%': { transform: 'translateY(-100%) skewY(-12deg)', opacity: '0' },
          '27%': { transform: 'translateY(-90%) skewY(-12deg)', opacity: '0.3' },
          '30%': { transform: 'translateY(110%) skewY(-12deg)', opacity: '0' },
          '32%': { transform: 'translateY(-100%) skewY(-12deg)', opacity: '0' },
          '60%': { transform: 'translateY(-100%) skewY(-12deg)', opacity: '0' },
          '62%': { transform: 'translateY(-85%) skewY(-12deg)', opacity: '0.8' },
          '68%': { transform: 'translateY(115%) skewY(-12deg)', opacity: '0' },
          '70%': { transform: 'translateY(-100%) skewY(-12deg)', opacity: '0' },
          '100%': { transform: 'translateY(-100%) skewY(-12deg)', opacity: '0' }
        }
      },
      animation: {
        shine: 'shine 8s ease-in-out infinite'
      }
    },
  },
  plugins: [],
} 