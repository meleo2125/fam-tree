import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "media",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: { DEFAULT: "#FBF6EF", dark: "#1B1614" },
        surface: { DEFAULT: "#FFFFFF", dark: "#26201D" },
        primary: { DEFAULT: "#8C2F39", dark: "#C4525C" },
        accent: { DEFAULT: "#C79A3C", dark: "#D9B25E" },
        textPrimary: { DEFAULT: "#2A1E18", dark: "#F1E9DE" },
        textSecondary: { DEFAULT: "#6B5D52", dark: "#B8A896" },
        border: { DEFAULT: "#E4D8C6", dark: "#3A322C" },
        male: "#4B6E8A",
        female: "#A85A73",
      },
      fontFamily: {
        heading: ["var(--font-heading)", "Poppins", "sans-serif"],
        body: ["var(--font-body)", "Inter", "sans-serif"],
      },
      borderRadius: {
        card: "12px",
      },
    },
  },
  plugins: [],
};

export default config;
