/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        power: '#22d3ee',
        fault: '#ef4444',
        warning: '#fbbf24',
      },
    },
  },
  plugins: [],
};
