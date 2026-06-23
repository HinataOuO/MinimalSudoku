/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        ink: "#F2F2F2",
        muted: "#8A8A8A",
        line: "#222222",
        strongLine: "#464646",
        panel: "#111111",
        panelElevated: "#151515",
        canvas: "#0A0A0A",
        accent: "#FFB547",
        accentInk: "#14100A",
        accentSoft: "#261D0F",
        dangerSoft: "#241313",
        danger: "#D66A6A"
      }
    }
  },
  plugins: []
};
