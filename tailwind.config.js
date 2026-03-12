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
          DEFAULT: '#FD207A',
          50:  '#fff0f6',
          100: '#ffd6e8',
          200: '#ffadd1',
          300: '#ff85ba',
          400: '#ff5ca3',
          500: '#FD207A',
          600: '#d81568',
          700: '#b00d55',
          800: '#880842',
          900: '#60052f',
        },
        secondary: {
          DEFAULT: '#146EB4',
          50:  '#e8f4fd',
          100: '#c5e3f9',
          200: '#8bc5f3',
          300: '#52a8ed',
          400: '#1f8be5',
          500: '#146EB4',
          600: '#0f5a97',
          700: '#0b457a',
          800: '#073060',
          900: '#041d3d',
        },
        accent: {
          DEFAULT: '#8D126E',
          light: '#b9189a',
          dark:  '#620e4d',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      screens: {
        xs: '375px',
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
      },
    },
  },
  plugins: [],
}
