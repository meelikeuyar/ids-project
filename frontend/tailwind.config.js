/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: '#010508',
          surface: '#060d14',
          card: '#0a1520', // Kartlar için biraz daha ayrışan bir ton ekledik
          border: '#0f291e',
          green: '#00ff41',
          blue: '#00aaff',
          red: '#ff0040',
          orange: '#ff8c00',
          muted: '#3a8a5a',
          text: '#c0d4e8',
        },
      },
      fontFamily: {
        mono: ['Share Tech Mono', 'monospace'],
        display: ['Orbitron', 'sans-serif'],
      },
      boxShadow: {
        'neon-green': '0 0 15px rgba(0, 255, 65, 0.15)',
        'neon-red': '0 0 15px rgba(255, 0, 64, 0.15)',
        'neon-blue': '0 0 15px rgba(0, 170, 255, 0.15)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan': 'scan 4s linear infinite',
      },
      keyframes: {
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(1000%)' },
        },
      },
    },
  },
  plugins: [],
};