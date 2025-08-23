import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "#0D2A4B", 600: "#0D2A4B", 700: "#0A223C" },
        accent: { DEFAULT: "#FF6B00", 600: "#E65F00", 700: "#CC5400" },
        bg: "#F2F2F2",
        surface: "#FFFFFF",
        text: { DEFAULT: "#1A1A1A", muted: "#666666" },
      },
      borderRadius: { xl: "1rem", "2xl": "1.25rem" },
      boxShadow: { card: "0 8px 30px rgba(0,0,0,.06)", soft: "0 2px 12px rgba(0,0,0,.08)" },
    },
  },
  plugins: [require("@tailwindcss/forms"), require("@tailwindcss/typography")],
} satisfies Config;
