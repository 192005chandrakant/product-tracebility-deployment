module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
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
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'bounce-subtle': 'bounceSubtle 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
    },
  },
  plugins: [
    // Add any required plugins here
  ],
  // Production optimizations
  ...(process.env.NODE_ENV === 'production' && {
    purge: {
      enabled: true,
      content: [
        "./src/**/*.{js,jsx,ts,tsx}",
        "./public/index.html"
      ],
      options: {
        safelist: [
          // Preserve dynamic classes
          /^bg-/,
          /^text-/,
          /^border-/,
          /^hover:/,
          /^dark:/,
        ],
      },
    },
  }),
}; 