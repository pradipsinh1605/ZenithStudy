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
      fontFamily: {
        sora: ["Sora", "sans-serif"],
        lora: ["Lora", "serif"],
      },
      colors: {
        primary: {
          50:  "#EFF6FF",
          100: "#DBEAFE",
          500: "#4F8EF7",
          600: "#2563EB",
          700: "#1D4ED8",
        },
        dark: {
          bg:      "#060D1B",
          surface: "#0B1628",
          card:    "#0E1E38",
          border:  "#1A2E4A",
        },
      },
      animation: {
        "fade-in":    "fadeIn 0.4s ease forwards",
        "slide-in":   "slideIn 0.3s ease forwards",
        "pulse-slow": "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        fadeIn: {
          "0%":   { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideIn: {
          "0%":   { opacity: "0", transform: "translateX(-12px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
