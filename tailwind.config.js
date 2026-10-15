/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        charcoal: {
          DEFAULT: '#445363',
          dark: '#34404e',
          light: '#536578',
        },
        creamGrey: '#E5E8E1',
        'cream-grey': '#E5E8E1',
        olive: {
          DEFAULT: '#454F2A',
          dark: '#384022',
          light: '#586536',
        },
        mustard: {
          DEFAULT: '#EDD575',
          dark: '#dfc455',
          light: '#f5e49a',
        },
        warmBeige: '#F5EAD9',
        'warm-beige': '#F5EAD9',
        softCream: '#FAF8F1',
        'soft-cream': '#FAF8F1',
        chakraBlue: {
          DEFAULT: '#315D9B',
          dark: '#274b7d',
          light: '#3d72bc',
        },
        'chakra-blue': '#315D9B',
        navy: {
          50: '#f0f5fa',
          100: '#e1ecf5',
          200: '#c6dcee',
          300: '#9bc3e1',
          400: '#6aa4d0',
          500: '#4585bc',
          600: '#326ba3',
          700: '#285684',
          800: '#1b365d',
          900: '#0f223d',
          950: '#0a172a',
        },
        civic: {
          teal: {
            50: '#f0fdf9',
            100: '#ccfbf1',
            200: '#99f6e4',
            300: '#5eead4',
            400: '#2dd4bf',
            500: '#14b8a6',
            600: '#0d9488',
            700: '#0f766e',
            800: '#115e59',
            900: '#134e4a',
          },
          emerald: {
            50: '#ecfdf5',
            100: '#d1fae5',
            200: '#a7f3d0',
            300: '#6ee7b7',
            400: '#34d399',
            500: '#10b981',
            600: '#059669',
            700: '#047857',
            800: '#065f46',
            900: '#064e3b',
          }
        }
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans Devanagari', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'civic-card': '0 2px 8px -2px rgba(15, 34, 61, 0.08), 0 4px 16px -2px rgba(15, 34, 61, 0.05)',
        'civic-glow': '0 0 24px -4px rgba(13, 148, 136, 0.25)',
      }
    },
  },
  plugins: [],
}

