module.exports = {
  presets: ['babel-preset-expo'],
  // Hermes rejects oRPC's async rest/destructured parameters without these transforms.
  plugins: [
    require.resolve('@babel/plugin-transform-parameters'),
    require.resolve('@babel/plugin-transform-destructuring'),
    require('@varlock/expo-integration/babel-plugin'),
  ],
};
