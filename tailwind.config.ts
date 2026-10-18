import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          emerald: "#10b981",
          indigo: "#6366f1",
          amber: "#f59e0b",
          rose: "#f43f5e",
        },
        chart: {
          "1": "#785EF0",
          "2": "#F472B6",
          "3": "#EC4899",
          "4": "#F6AD55",
          "5": "#58A6FF",
          "6": "#FBBF24",
          "7": "#34D399",
          "8": "#A78BFA",
        },
      },
      fontFamily: {
        sans: ["Geist Sans", "Inter", "sans-serif"],
        mono: ["Geist Mono", "JetBrains Mono", "mono"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;