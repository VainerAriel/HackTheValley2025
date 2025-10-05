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
          50: '#fdfbf7',
          100: '#faf6ef',
          200: '#f5ece0',
          300: '#ede0ca',
          400: '#e4d4b4',
          500: '#d6c5a0',
        },
        brand: {
          brown: {
            light: '#c4a57b',
            DEFAULT: '#a88f6c',
            dark: '#8b7355',
          },
          accent: {
            light: '#d4b896',
            DEFAULT: '#b89968',
            dark: '#9d7f4f',
          }
        }
      }
    }
  },
  plugins: [],
}

