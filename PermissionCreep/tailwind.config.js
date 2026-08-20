/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['IBM Plex Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        dark: {
          900: '#020817',
          800: '#080E19',
          700: '#0F172A',
          600: '#1E293B',
          500: '#334155',
        }
      }
    },
  },
  plugins: [],
}
