/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        sand: { 50: '#fffbf5', 100: '#fbf3e6', 200: '#f2e2c6' },
        dz: { DEFAULT: '#0f766e', light: '#ccfbf1', dark: '#115e59' },
        kab: { DEFAULT: '#c2410c', light: '#ffedd5', dark: '#9a3412' },
      },
      fontFamily: { sans: ['"Nunito"', 'system-ui', 'sans-serif'] },
      keyframes: {
        pop: { '0%': { transform: 'scale(.9)', opacity: '0' }, '100%': { transform: 'scale(1)', opacity: '1' } },
        shake: { '0%,100%': { transform: 'translateX(0)' }, '25%': { transform: 'translateX(-6px)' }, '75%': { transform: 'translateX(6px)' } },
      },
      animation: { pop: 'pop .25s ease-out', shake: 'shake .3s ease-in-out' },
    },
  },
  plugins: [],
};
