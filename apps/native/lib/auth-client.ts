import { expoClient } from '@better-auth/expo/client';
import { passkeyClient } from '@better-auth/passkey/client';
import { serverUrl } from '@native/lib/connections';
import { anonymousClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';
import * as SecureStore from 'expo-secure-store';

export const authClient = createAuthClient({
  baseURL: serverUrl,
  plugins: [
    expoClient({
      scheme: 'movies',
      storagePrefix: 'movies',
      storage: SecureStore,
      disableCache: true,
    }),
    anonymousClient(),
    passkeyClient(),
  ],
});
