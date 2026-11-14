import transformDestructuring from '@babel/plugin-transform-destructuring';
import transformParameters from '@babel/plugin-transform-parameters';
import varlock from '@varlock/expo-integration/babel-plugin';

export default {
  presets: ['babel-preset-expo'],
  // Hermes rejects oRPC's async rest/destructured parameters without these transforms.
  plugins: [transformParameters, transformDestructuring, varlock],
};
