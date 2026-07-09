import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@xyflow/react/**/*.{js,ts,jsx,tsx}",
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
        zen: {
          sage: "#7d9b8a",
          mist: "#a8b5c4",
          sand: "#c4b5a0",
          deep: "#0a0f0d",
          card: "#141a17",
          border: "#1f2a24",
          cyan: "#22d3ee",
          purple: "#8b5cf6",
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
        zen: "0 4px 24px rgba(125, 155, 138, 0.08)",
        "zen-lg": "0 8px 32px rgba(125, 155, 138, 0.14)",
        "zen-logo":
          "0 0 40px rgba(34, 211, 238, 0.25), 0 0 80px rgba(139, 92, 246, 0.15)",
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
        "zen-pulse": "zen-pulse 4s ease-in-out infinite",
        "zen-breathe": "zen-breathe 5s ease-in-out infinite",
        "zen-spin-slow": "zen-spin 24s linear infinite",
        "zen-float": "zen-float 8s ease-in-out infinite",
        "zen-float-slow": "zen-float 12s ease-in-out infinite reverse",
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
        "zen-pulse": {
          "0%, 100%": { opacity: "0.5", transform: "scale(1)" },
          "50%": { opacity: "0.9", transform: "scale(1.05)" },
        },
        "zen-breathe": {
          "0%, 100%": { opacity: "0.55", transform: "scale(0.96)" },
          "50%": { opacity: "1", transform: "scale(1.04)" },
        },
        "zen-spin": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        "zen-float": {
          "0%, 100%": { transform: "translate(0, 0)" },
          "50%": { transform: "translate(12px, -18px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;