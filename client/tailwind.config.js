/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./pages/**/*.{js,jsx}', './src/**/*.{js,jsx}', './public/index.html'],
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#0a0a0f',
          800: '#12121a',
          700: '#1a1a25',
          600: '#222230',
          500: '#2a2a3a',
          400: '#363648',
        },
        accent: {
          red: '#ef4444',
          green: '#22c55e',
          blue: '#3b82f6',
          orange: '#f97316',
          yellow: '#eab308',
          teal: '#14b8a6',
          cyan: '#06b6d4',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
