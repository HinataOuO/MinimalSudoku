/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        ink: "#111827",
        muted: "#64748b",
        line: "#cbd5e1",
        panel: "#ffffff",
        canvas: "#f8fafc",
        accent: "#0f766e",
        accentSoft: "#ccfbf1",
        dangerSoft: "#fee2e2",
        danger: "#dc2626"
      }
    }
  },
  plugins: []
};
