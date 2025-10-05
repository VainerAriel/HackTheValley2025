/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        'opendyslexic': ['OpenDyslexic', 'sans-serif']
      },
      colors: {
        cream: {
          50: '#fdfcfa',
          100: '#faf8f4',
          200: '#f5f1e8',
          300: '#f0e9dc',
          400: '#ebe2d0',
          500: '#e6dac4',
        },
        brand: {
          brown: {
            light: '#8B7355',
            DEFAULT: '#6B5744',
            dark: '#4A3C2E',
          },
          blue: {
            light: '#5B9BD5',
            DEFAULT: '#4A7FB8',
            dark: '#2E5A8A',
          }
        }
      }
    }
  },
  plugins: [],
}

