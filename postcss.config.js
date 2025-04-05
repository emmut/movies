module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
    'postcss-preset-env': {
      features: {
        'is-pseudo-class': false // Disable the transformation of :is()
      }
    },
  },
};
