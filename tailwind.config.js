/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#102A43",
          dark: "#0B1E30",
        },
        brand: {
          blue: "#1F5A94",
          light: "#D9EAF7",
        },
        success: "#1F9D68",
        warning: "#F4B740",
        danger: "#D64545",
        surface: "#F4F6F8",
        ink: "#1F2933",
      },
      fontFamily: {
        sans: ["Inter", "Segoe UI", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(16,42,67,0.08), 0 1px 2px rgba(16,42,67,0.06)",
        soft: "0 4px 12px rgba(16,42,67,0.08)",
      },
      borderRadius: {
        xl: "0.75rem",
      },
    },
  },
  plugins: [],
};
