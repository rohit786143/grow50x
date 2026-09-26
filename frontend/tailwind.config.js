/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        darkBg: '#080b11',
        cardBg: '#101726',
        cardBorder: 'rgba(255, 255, 255, 0.08)',
        cyanGlow: '#06b6d4',
        emeraldGlow: '#10b981',
      },
    },
  },
  plugins: [],
};
