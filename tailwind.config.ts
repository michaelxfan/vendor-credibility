import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "hsl(var(--bg) / <alpha-value>)",
        surface: "hsl(var(--surface) / <alpha-value>)",
        "surface-2": "hsl(var(--surface-2) / <alpha-value>)",
        border: "hsl(var(--border) / <alpha-value>)",
        fg: "hsl(var(--fg) / <alpha-value>)",
        muted: "hsl(var(--muted) / <alpha-value>)",
        dim: "hsl(var(--dim) / <alpha-value>)",
        accent: "hsl(var(--accent) / <alpha-value>)",
        good: "hsl(var(--good) / <alpha-value>)",
        mid: "hsl(var(--mid) / <alpha-value>)",
        bad: "hsl(var(--bad) / <alpha-value>)",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Text",
          "Inter",
          "system-ui",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
