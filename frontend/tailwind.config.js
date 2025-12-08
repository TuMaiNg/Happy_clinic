/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Professional Medical Color Scheme
        primary: {
          DEFAULT: '#0066CC', // Primary Blue
          50: '#E8F4F8', // Light Blue
          100: '#D1E9F1',
          200: '#A3D3E3',
          300: '#75BDD5',
          400: '#47A7C7',
          500: '#0066CC', // Main
          600: '#0052A3',
          700: '#003D7A',
          800: '#002952',
          900: '#001429',
        },
        secondary: {
          DEFAULT: '#00A86B', // Primary Green
          50: '#F0F8F5', // Soft Green
          100: '#E1F1EB',
          200: '#C3E3D7',
          300: '#A5D5C3',
          400: '#87C7AF',
          500: '#00A86B', // Main
          600: '#008656',
          700: '#006441',
          800: '#00422C',
          900: '#002116',
        },
        accent: {
          DEFAULT: '#20B2AA', // Accent Teal
          50: '#E8F7F6',
          100: '#D1EFED',
          200: '#A3DFDB',
          300: '#75CFC9',
          400: '#47BFB7',
          500: '#20B2AA',
          600: '#1A8E88',
          700: '#136A66',
          800: '#0D4644',
          900: '#062322',
        },
        warm: {
          DEFAULT: '#FFF9F0', // Warm Cream
          50: '#FFF9F0',
          100: '#FFF3E0',
          200: '#FFE7C1',
          300: '#FFDBA2',
          400: '#FFCF83',
        },
        neutral: {
          white: '#FFFFFF',
          light: '#F5F7FA',
          medium: '#8B95A5',
          dark: '#2D3748',
          border: '#E2E8F0',
        },
        status: {
          success: '#00C853',
          warning: '#FFA726',
          error: '#F44336',
          info: '#2196F3',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Inter', 'SF Pro Display', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '8px',
        lg: '12px',
        xl: '16px',
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'medium': '0 4px 16px rgba(0, 102, 204, 0.15)',
        'large': '0 8px 24px rgba(0, 0, 0, 0.12)',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
    },
  },
  plugins: [],
}
