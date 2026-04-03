/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fff1f2",
          100: "#ffe4e6",
          200: "#fecdd3",
          300: "#fda4af",
          400: "#fb7185",
          500: "#f43f5e",
          600: "#e11d48",
          700: "#be123c",
          800: "#9f1239",
          900: "#881337"
        }
      },
      boxShadow: {
        glow: "0 20px 45px rgba(225, 29, 72, 0.18)"
      },
      backgroundImage: {
        mesh: "radial-gradient(circle at top left, rgba(244, 63, 94, 0.18), transparent 30%), radial-gradient(circle at bottom right, rgba(15, 23, 42, 0.8), transparent 35%)"
      }
    }
  },
  plugins: []
};
