import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/providers/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: "#f4f1ea",
          muted: "#e8e3d5",
          dark: "#dad4c3",
        },
        ink: {
          DEFAULT: "#0d0d0d",
          muted: "#3a3a3a",
        },
        pencil: "#666666",
        punk: {
          pink: "#ff2a85",
          yellow: "#ffe600",
          green: "#00e676",
          cyan: "#00f0ff",
          orange: "#ff5500",
        },
      },
      boxShadow: {
        hard: "4px 4px 0px 0px #0d0d0d",
        "hard-sm": "2px 2px 0px 0px #0d0d0d",
        "hard-lg": "6px 6px 0px 0px #0d0d0d",
        "hard-xl": "8px 8px 0px 0px #0d0d0d",
        "punk-pink": "4px 4px 0px 0px #ff2a85",
        "punk-yellow": "4px 4px 0px 0px #ffe600",
      },
      borderWidth: {
        "3": "3px",
      },
      fontFamily: {
        mono: [
          "Space Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
