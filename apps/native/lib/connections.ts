import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { resolveServiceUrl } from './service-url';

const browserOrigin =
  Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.origin : undefined;
const expoHost = Constants.expoConfig?.hostUri;

export const serverUrl = resolveServiceUrl({
  explicitUrl: process.env.EXPO_PUBLIC_SERVER_URL,
  browserOrigin,
  expoHost,
  port: 3001,
});
export const webUrl = resolveServiceUrl({
  explicitUrl: process.env.EXPO_PUBLIC_WEB_URL,
  browserOrigin,
  expoHost,
  port: 3000,
});
