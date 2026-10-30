import { authClient } from '@native/lib/auth-client';
import { signInDevicePasskey } from '@native/lib/passkeys';
import { createSignInFlow, type SignInMethod } from '@native/lib/sign-in-flow';
import { Platform } from 'react-native';

function authCallback(path: string) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return window.location.origin + path;
  }
  return path;
}
type SocialProvider = 'discord' | 'github';
async function socialSignIn(
  provider: SocialProvider,
  destination: string,
  errorDestination: string,
) {
  return authClient.signIn.social({
    provider,
    callbackURL: authCallback(destination),
    errorCallbackURL: authCallback(errorDestination),
  });
}
async function signIn(method: SignInMethod, destination: string) {
  if (method === 'anonymous') {
    return authClient.signIn.anonymous();
  }
  if (method === 'passkey') {
    return signInDevicePasskey();
  }
  return socialSignIn(method, destination, '/login?error=failed_to_login');
}
async function currentUser() {
  const result = await authClient.getSession({ query: { disableCookieCache: true } });
  return result.data?.user ?? null;
}
export const runSignIn = createSignInFlow({ signIn, current: currentUser });
export const runAccountLink = createSignInFlow<SocialProvider>(
  {
    signIn: (provider, destination) =>
      socialSignIn(provider, destination, '/more/settings?error=failed_to_link_account'),
    current: currentUser,
  },
  {
    failed: 'Couldn’t link your account. Please try again.',
    cancelled: 'Account linking was cancelled or did not finish. Please try again.',
    network: 'Couldn’t link your account. Check your connection and try again.',
  },
);
