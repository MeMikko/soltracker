import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      screens: {
        xs: "480px",
      },
      colors: {
        surface: {
          DEFAULT: "#06060b",
          raised: "#0e0e16",
          card: "#12121c",
          border: "#1e1e2e",
          hover: "#1a1a28",
        },
        solana: {
          purple: "#9945ff",
          green: "#14f195",
        },
        accent: {
          green: "#14f195",
          yellow: "#fbbf24",
          red: "#f43f5e",
          blue: "#38bdf8",
          violet: "#a78bfa",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        glow: "0 0 24px rgba(153, 69, 255, 0.2)",
        "glow-sm": "0 0 12px rgba(56, 189, 248, 0.15)",
        card: "0 4px 32px rgba(0, 0, 0, 0.45)",
        "inner-glow": "inset 0 1px 0 rgba(255, 255, 255, 0.05)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-solana":
          "linear-gradient(135deg, #9945ff 0%, #14f195 100%)",
        "gradient-card":
          "linear-gradient(135deg, rgba(153,69,255,0.08) 0%, rgba(20,241,149,0.04) 100%)",
      },
      animation: {
        "pulse-glow": "pulse-glow 2.5s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;