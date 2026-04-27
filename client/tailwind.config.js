module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './public/index.html'
  ],
  theme: {
    extend: {
      colors: {
        midnight: '#13111C',
        amethyst: '#1C1926',
        violet: '#A855F7',
        aqua: '#2DD4BF',
        ink: '#0B0A10',
        cyber: {
          bg: '#13111C',
          surface: '#1C1926',
          surfaceSoft: '#252131',
          accent: '#A855F7',
          success: '#2DD4BF',
          glass: 'rgba(168, 85, 247, 0.15)',
        },
        glass: 'rgba(255,255,255,0.15)',
        glassDark: 'rgba(30,41,59,0.6)',
        neu: '#e0e5ec',
        neuDark: '#23272f',
      },
      boxShadow: {
        cyber: '0 0 30px rgba(168, 85, 247, 0.18)',
        'cyber-hover': '0px 0px 20px rgba(168, 85, 247, 0.3)',
        teal: '0 0 20px rgba(45, 212, 191, 0.28)',
        neu: '8px 8px 16px #d1d9e6, -8px -8px 16px #ffffff',
        neuDark: '8px 8px 16px #181c22, -8px -8px 16px #2c313a',
        glass: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'bounce-subtle': 'bounceSubtle 2s infinite',
        'pulse-teal': 'pulseTeal 2s ease-in-out infinite',
        'shimmer-purple': 'shimmerPurple 1.8s linear infinite',
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
        pulseTeal: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(45, 212, 191, 0.4)' },
          '50%': { boxShadow: '0 0 0 10px rgba(45, 212, 191, 0)' },
        },
        shimmerPurple: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [
    // Add any required plugins here
  ],
}; 
