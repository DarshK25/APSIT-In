import daisyui from 'daisyui'
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Light mode colors
        primary: {
          DEFAULT: '#2563eb',
          dark: '#1d4ed8',
          light: '#3b82f6',
        },
        // Dark mode colors
        dark: {
          primary: '#3b82f6',
          secondary: '#1e293b',
          card: '#1e293b',
          hover: '#2d3748',
          border: '#334155',
          text: {
            primary: '#f8fafc',
            secondary: '#cbd5e1',
            muted: '#94a3b8',
          },
        },
      },
    },
  },
  plugins: [daisyui],
}