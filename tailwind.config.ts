import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        candy: {
          pink: "#f472b6",
          purple: "#c084fc",
          indigo: "#818cf8",
          blue: "#38bdf8",
          emerald: "#34d399",
          amber: "#fbbf24",
          rose: "#fb7185",
        },
      },
      animation: {
        'spin-slow': 'spin 12s linear infinite',
        'spin-reverse-slow': 'spin-reverse 15s linear infinite',
        'twinkle-spin': 'twinkleSpin 7s ease-in-out infinite',
        'twinkle-spin-slow': 'twinkleSpin 12s ease-in-out infinite',
        'twinkle-spin-reverse': 'twinkleSpinReverse 9s ease-in-out infinite',
      },
      keyframes: {
        'spin-reverse': {
          to: {
            transform: 'rotate(-360deg)',
          },
        },
        twinkleSpin: {
          '0%': {
            transform: 'rotate(0deg) scale(0.88)',
            opacity: '0.65',
          },
          '50%': {
            transform: 'rotate(180deg) scale(1.15)',
            opacity: '1',
          },
          '100%': {
            transform: 'rotate(360deg) scale(0.88)',
            opacity: '0.65',
          },
        },
        twinkleSpinReverse: {
          '0%': {
            transform: 'rotate(0deg) scale(1.12)',
            opacity: '1',
          },
          '50%': {
            transform: 'rotate(-180deg) scale(0.85)',
            opacity: '0.55',
          },
          '100%': {
            transform: 'rotate(-360deg) scale(1.12)',
            opacity: '1',
          },
        },
      },
    },
  },
  plugins: [],
};
export default config;
