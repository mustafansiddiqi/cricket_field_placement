/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        pitch: {
          green:  "#2d5a1b",
          light:  "#4a8c2a",
          grass:  "#3b7a22",
        },
        cricket: {
          cream:  "#f5f0e1",
          brown:  "#8B4513",
          white:  "#fafafa",
        }
      },
      animation: {
        "field-in": "fieldIn 0.4s ease-out",
        "ball-fly":  "ballFly 0.8s ease-in-out",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        fieldIn: {
          "0%":   { opacity: "0", transform: "scale(0.8)" },
          "100%": { opacity: "1", transform: "scale(1)"   },
        },
        ballFly: {
          "0%":   { transform: "translate(0,0) scale(1)" },
          "50%":  { transform: "translate(var(--dx), var(--dy)) scale(1.4)" },
          "100%": { transform: "translate(calc(var(--dx)*2), calc(var(--dy)*2)) scale(0.8)" },
        }
      },
    },
  },
  plugins: [],
};
