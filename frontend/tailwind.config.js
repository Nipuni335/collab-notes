// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        // Display font for headings — editorial and distinctive
        display: ["'Playfair Display'", "Georgia", "serif"],
        // Body / UI font — clean and legible
        sans: ["'DM Sans'", "system-ui", "sans-serif"],
        // Monospace for code blocks
        mono: ["'JetBrains Mono'", "monospace"],
      },
      colors: {
        // Primary brand — deep forest tones
        forest: {
          50:  "#f0f7f4",
          100: "#d8ede6",
          200: "#b2dacf",
          300: "#7ec0b0",
          400: "#4da08d",
          500: "#318373",
          600: "#25685c",
          700: "#1e534a",
          800: "#1a433c",
          900: "#173832",
          950: "#0b201e",
        },
        // Accent — warm amber
        amber: {
          400: "#fbbf24",
          500: "#f59e0b",
        },
        // Note card colours
        "note-yellow":  "#fef9c3",
        "note-pink":    "#fce7f3",
        "note-blue":    "#dbeafe",
        "note-green":   "#dcfce7",
        "note-purple":  "#f3e8ff",
        "note-orange":  "#ffedd5",
      },
      boxShadow: {
        card: "0 2px 8px rgba(0,0,0,0.06), 0 0 1px rgba(0,0,0,0.08)",
        "card-hover": "0 8px 24px rgba(0,0,0,0.10), 0 0 1px rgba(0,0,0,0.08)",
        modal: "0 20px 60px rgba(0,0,0,0.15)",
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease-out",
        "slide-up": "slideUp 0.25s ease-out",
        "slide-right": "slideRight 0.2s ease-out",
      },
      keyframes: {
        fadeIn:    { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp:   { from: { opacity: 0, transform: "translateY(10px)" }, to: { opacity: 1, transform: "translateY(0)" } },
        slideRight:{ from: { opacity: 0, transform: "translateX(-10px)" }, to: { opacity: 1, transform: "translateX(0)" } },
      },
    },
  },
  plugins: [],
};
