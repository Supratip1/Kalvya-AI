// tailwind.config.js
module.exports = {
    darkMode: 'class', // Enable dark mode via class
    content: [
      "./src/**/*.{js,jsx,ts,tsx}", // Adjust according to your project structure
    ],
    theme: {
      extend: {
        keyframes: {
          blob: {
            "0%, 100%": { transform: "scale(1)" },
            "50%": { transform: "scale(1.2)" },
          },
          fontFamily: {
            poppins: ['Poppins', 'sans-serif'],
          },
          gradient: {
            "0%, 100%": { backgroundPosition: "0% 50%" },
            "50%": { backgroundPosition: "100% 50%" },
          },
        },
        animation: {
          blob: "blob 7s infinite ease-in-out",
          gradient: "gradient 15s ease infinite",
        },
        transitionDelay: {
          2000: "2000ms",
        },
      },
    },
    plugins: [],
  };
  