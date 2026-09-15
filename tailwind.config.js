/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        midnight: {
          50: '#f0f4ff',
          100: '#e0eaff',
          200: '#c7d7fe',
          300: '#a4bbfd',
          400: '#7c93fb',
          500: '#5c6ef6',
          600: '#3f48ea',
          700: '#3237d0',
          800: '#2b2ea8',
          900: '#0b0f19',
          950: '#05070f',
        },
        shield: {
          cyan: '#00F5D4',
          emerald: '#10B981',
          violet: '#7B2CBF',
          amber: '#F59E0B',
          neon: '#00FFC2',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      }
    },
  },
  plugins: [],
};
