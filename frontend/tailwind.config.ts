import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: '#08111f',
        ember: '#f97316',
        signal: '#22d3ee',
        lime: '#a3e635',
        mist: '#94a3b8',
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(34, 211, 238, 0.12), 0 18px 48px rgba(8, 17, 31, 0.34)',
      },
      backgroundImage: {
        'mesh-grid': 'linear-gradient(rgba(148,163,184,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.08) 1px, transparent 1px)',
      },
      fontFamily: {
        sans: ['var(--font-space)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      animation: {
        rise: 'rise 0.6s ease-out both',
      },
      keyframes: {
        rise: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
