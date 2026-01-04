/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#165B33',
        secondary: '#BB2528',
        accent: '#F8B229',
        background: '#FAFAFA',
        surface: '#FFFFFF',
        'text-primary': '#212121',
        'text-secondary': '#757575',
        border: '#E0E0E0',
      },
    },
  },
  plugins: [],
}
