module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        glass: 'rgba(255,255,255,0.15)',
        glassDark: 'rgba(30,41,59,0.6)',
        neu: '#e0e5ec',
        neuDark: '#23272f',
      },
      boxShadow: {
        neu: '8px 8px 16px #d1d9e6, -8px -8px 16px #ffffff',
        neuDark: '8px 8px 16px #181c22, -8px -8px 16px #2c313a',
        glass: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
      },
    },
  },
  plugins: [],
}; 