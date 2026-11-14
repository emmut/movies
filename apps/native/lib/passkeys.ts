import { passkeyListSchema } from '@movies/api/passkeys';
import { authClient } from '@native/lib/auth-client';
import { createPasskeyCeremony } from '@native/lib/passkey-ceremony';
import { ENV } from '@native/src/env';
import { requireOptionalNativeModule } from 'expo';
import { Platform } from 'react-native';

export function isPasskeySupported() {
  if (Platform.OS === 'web') {
    return typeof window !== 'undefined' && typeof window.PublicKeyCredential !== 'undefined';
  }
  if (!ENV.EXPO_PUBLIC_PASSKEY_DOMAIN) {
    return false;
  }
  const nativePasskeys = requireOptionalNativeModule<{ isSupported: () => boolean }>(
    'ReactNativePasskeys',
  );
  return Boolean(nativePasskeys?.isSupported());
}
const ceremony = createPasskeyCeremony({
  available: isPasskeySupported,
  request: (path, options) => authClient.$fetch(path, { ...options, throw: false }),
  async register(options) {
    const passkeys = await import('react-native-passkeys');
    return passkeys.create(options);
  },
  async authenticate(options) {
    const passkeys = await import('react-native-passkeys');
    return passkeys.get(options);
  },
});
export async function addDevicePasskey(name: string) {
  if (Platform.OS === 'web') {
    return authClient.passkey.addPasskey({ name });
  }
  return ceremony.add(name);
}
export async function signInDevicePasskey() {
  if (Platform.OS === 'web') {
    return authClient.signIn.passkey();
  }
  return ceremony.signIn();
}
export async function readPasskeys() {
  const result = await authClient.passkey.listUserPasskeys();
  if (result.error || !result.data) {
    throw Object.assign(new Error('Could not load passkeys'), {
      code: result.error?.status === 401 ? 'UNAUTHORIZED' : result.error?.code,
    });
  }
  return passkeyListSchema.parse(result.data);
}
