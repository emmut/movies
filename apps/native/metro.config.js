const { getDefaultConfig } = require('expo/metro-config');
const { withUniwindConfig } = require('uniwind/metro');
const { withVarlockMetroConfig } = require('@varlock/expo-integration/metro-config');
const { wrapWithReanimatedMetroConfig } = require('react-native-reanimated/metro-config');

const config = withUniwindConfig(wrapWithReanimatedMetroConfig(getDefaultConfig(__dirname)), {
  cssEntryFile: './global.css',
  dtsFile: './uniwind-types.d.ts',
});
module.exports = withVarlockMetroConfig(config);
