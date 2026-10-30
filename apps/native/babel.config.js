module.exports = {
  presets: ['babel-preset-expo'],
  // Hermes rejects oRPC's async rest/destructured parameters without these transforms.
  plugins: [
    '@babel/plugin-transform-parameters',
    '@babel/plugin-transform-destructuring',
    require('@varlock/expo-integration/babel-plugin'),
  ],
};
