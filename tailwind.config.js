/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        app: {
          bg: 'var(--color-background)',
          surface: 'var(--color-surface)',
          border: 'var(--color-border)',
          text: 'var(--color-text)',
          muted: 'var(--color-text-muted)',
          primary: 'var(--color-primary)',
          'primary-text': 'var(--color-primary-text)',
          accent: 'var(--color-accent)',
          'accent-text': 'var(--color-accent-text)',
          tintGreen: 'var(--color-tint-green)',
          tintGold: 'var(--color-tint-gold)',
          link: 'var(--color-link)',
        },
      },
      fontFamily: {
        heading: ['"Baloo 2"', 'cursive', 'sans-serif'],
        body: ['"Nunito Sans"', 'system-ui', 'sans-serif'],
        urdu: ['"Noto Nastaliq Urdu"', '"Jameel Noori Nastaleeq"', 'serif'],
      },
      borderRadius: {
        card: '20px',
        bubble: '20px',
        button: '14px',
        input: '14px',
      },
      minHeight: {
        touch: '44px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
