module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
    'postcss-preset-env': {
      features: {
        'is-pseudo-class': false,
      },
    },
  },
};
