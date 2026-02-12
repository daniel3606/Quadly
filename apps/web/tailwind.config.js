/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        /* Mobile app design tokens */
        primary: '#000000',
        'primary-light': '#333333',
        'text': '#1a1a1a',
        'text-secondary': '#999999',
        'text-light': '#606060',
        'background': '#ffffff',
        'background-secondary': '#f5f5f5',
        'background-subtle': '#f6f6f6',
        border: '#e0e0e0',
        link: '#007AFF',
        success: '#34C759',
        warning: '#FF9500',
        error: '#FF3B30',
        'tab-active': '#000000',
        'tab-inactive': '#999999',
        'icon-tint': '#00274C',
        umich: {
          blue: '#00274C',
          maize: '#FFCB05',
        },
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.08)',
        'card-lg': '0 2px 4px rgba(0,0,0,0.1)',
      },
      borderRadius: {
        card: '12px',
      },
      keyframes: {
        shine: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        shine: 'shine 8s ease-in-out infinite',
        'fade-in-up': 'fade-in-up 0.5s ease-out forwards',
      },
    },
  },
  plugins: [],
};
