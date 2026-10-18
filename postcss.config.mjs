const config = {
  plugins: {
    "@csstools/postcss-global-data": {
      files: ["./src/styles/breakpoints.css"],
    },
    "postcss-custom-media": {},
  },
};

export default config;
