import type { Config } from "tailwindcss";

import { fontFamily } from "tailwindcss/defaultTheme";

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", ...fontFamily.sans],
      },
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
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        cyberpunk: {
          blue: "#00fff7",
          pink: "#ff00ea",
          purple: "#a259ff",
          yellow: "#ffe600",
          dark: "#181825",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "wave-path-1": {
          "0%, 100%": {
            d: "path('M0,80 C150,120 350,0 600,80 C850,160 1050,40 1200,80 L1200,120 L0,120 Z')",
          },
          "50%": {
            d: "path('M0,80 C150,0 350,120 600,80 C850,40 1050,160 1200,80 L1200,120 L0,120 Z')",
          },
        },
        "wave-path-2": {
          "0%, 100%": {
            d: "path('M0,100 C200,60 400,140 600,100 C800,60 1000,140 1200,100 L1200,120 L0,120 Z')",
          },
          "50%": {
            d: "path('M0,100 C200,140 400,60 600,100 C800,140 1000,60 1200,100 L1200,120 L0,120 Z')",
          },
        },
        "wave-path-3": {
          "0%, 100%": {
            d: "path('M0,90 C300,130 600,50 900,90 C1050,110 1150,70 1200,90 L1200,120 L0,120 Z')",
          },
          "50%": {
            d: "path('M0,90 C300,50 600,130 900,90 C1050,70 1150,110 1200,90 L1200,120 L0,120 Z')",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "wave-path-1": "wave-path-1 8s ease-in-out infinite",
        "wave-path-2": "wave-path-2 12s ease-in-out infinite",
        "wave-path-3": "wave-path-3 10s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

export default config;
