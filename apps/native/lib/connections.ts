import { resolveServiceUrl } from '@native/lib/service-url';
import { ENV } from '@native/src/env';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const browserOrigin =
  Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.origin : undefined;
const expoHost = Constants.expoConfig?.hostUri;

export const serverUrl = resolveServiceUrl({
  explicitUrl: ENV.EXPO_PUBLIC_SERVER_URL,
  browserOrigin,
  expoHost,
  port: 3001,
});
