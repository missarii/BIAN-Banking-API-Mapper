/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0f1b2d',
        bian: '#0e5aa8',
      },
    },
  },
  plugins: [],
};
