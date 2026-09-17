/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bgMain:    'rgb(var(--shop-tint-rgb) / <alpha-value>)',
        cardBg:    '#FFFFFF',
        // Preferred Colour Theme — the shop owner's selected CARD COLOUR,
        // held as raw RGB channels so Tailwind opacity modifiers keep working
        // (bg-shopCard/20 etc). Set at runtime by src/lib/shopTheme.ts.
        shopCard:   'rgb(var(--shop-card-rgb) / <alpha-value>)',
        shopAccent: 'rgb(var(--shop-accent-rgb) / <alpha-value>)',
        shopSoft:   'rgb(var(--shop-soft-rgb) / <alpha-value>)',
        shopTint:   'rgb(var(--shop-tint-rgb) / <alpha-value>)',
        shopDeep:   'rgb(var(--shop-deep-rgb) / <alpha-value>)',
        onCard:     'var(--shop-on-card)',
        maroon: {
          DEFAULT: 'rgb(var(--shop-card-rgb) / <alpha-value>)', // selected card colour
          dark: 'rgb(var(--shop-deep-rgb) / <alpha-value>)', // deep shade of the card colour
        },
        textMain:  '#111111',
        textMuted: '#6B7280',
        borderLight: 'rgb(var(--shop-soft-rgb) / <alpha-value>)', // soft tint of the card colour
        // Storefront palette — used throughout Navbar/Footer/Cart/Checkout/
        // Login/Products/Profile/Favorites/Drawers but never previously
        // defined here, so every bg-sage/text-sageDark/border-sand/etc.
        // class in those files was silently rendering with no color at all.
        forestDark: '#2B1108',
        sage:       'rgb(var(--shop-card-rgb) / <alpha-value>)',
        sageDark:   'rgb(var(--shop-card-rgb) / <alpha-value>)',
        sageDeep:   '#5C1710',
        sand:       '#EFE1C8',
      },
      fontFamily: {
        sans:      ['Inter', 'sans-serif'],
        headline:  ['Inter', 'sans-serif'],
      },
      boxShadow: {
        soft:   '0 1px 3px rgba(0,0,0,0.05)',
      },
      borderRadius: {
        'card': '12px',
        'btn': '10px',
        'input': '10px',
        'table': '12px',
      },
      animation: {
        'float': 'float 4s ease-in-out infinite',
        'floatDelay': 'float 4s ease-in-out 1.5s infinite',
        'slideUp': 'slideUp 0.6s ease forwards',
        'fadeIn': 'fadeIn 0.5s ease forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(30px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
