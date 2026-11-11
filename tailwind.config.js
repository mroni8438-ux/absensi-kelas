/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#6A76CC",
          hover: "#5863B5",
          light: "#E7EAFB",
          50: "#F0F2FD",
          100: "#E7EAFB",
          500: "#6A76CC",
          600: "#5863B5",
          700: "#48529E",
        },
        growth: {
          DEFAULT: "#48BB78",
          light: "#E6FFFA",
        },
        page: "#EFF2F9",
        surface: "#FFFFFF",
        slate: {
          900: "#0F172A",
          800: "#1E293B",
          500: "#64748B",
          400: "#8C97B7",
          200: "#E2E8F0",
        }
      },
      borderRadius: {
        'card': '20px',
        'pill': '9999px',
      },
      fontFamily: {
        sans: ['var(--font-jakarta)', 'var(--font-inter)', '"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 10px 25px -5px rgba(106, 118, 204, 0.08)',
        'hover': '0 20px 30px -10px rgba(106, 118, 204, 0.16)',
        'glass': '0 20px 40px -15px rgba(106, 118, 204, 0.2)',
      }
    },
  },
  plugins: [],
};

