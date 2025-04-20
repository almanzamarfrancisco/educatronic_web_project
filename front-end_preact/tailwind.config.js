module.exports = {
  mode: "jit",
  purge: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      fontFamily: {
        nunito: ['Fredoka', 'sans-serif'], // Add Nunito font
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
};
