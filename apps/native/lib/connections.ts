import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { ENV } from '../src/env';
import { resolveServiceUrl } from './service-url';

const browserOrigin =
  Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.origin : undefined;
const expoHost = Constants.expoConfig?.hostUri;

export const serverUrl = resolveServiceUrl({
  explicitUrl: ENV.EXPO_PUBLIC_SERVER_URL,
  browserOrigin,
  expoHost,
  port: 3001,
});
export const webUrl = resolveServiceUrl({
  explicitUrl: ENV.EXPO_PUBLIC_WEB_URL,
  browserOrigin,
  expoHost,
  port: 3000,
});
