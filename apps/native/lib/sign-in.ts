import { authClient } from '@native/lib/auth-client';
import { createSignInFlow, type SignInMethod } from '@native/lib/sign-in-flow';
import { Platform } from 'react-native';

function authCallback(path: string) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return window.location.origin + path;
  }
  return path;
}
async function signIn(method: SignInMethod, destination: string) {
  if (method === 'anonymous') {
    return authClient.signIn.anonymous();
  }
  if (method === 'passkey') {
    return authClient.signIn.passkey();
  }
  return authClient.signIn.social({
    provider: method,
    callbackURL: authCallback(destination),
    errorCallbackURL: authCallback('/login?error=failed_to_login'),
  });
}
export const runSignIn = createSignInFlow({
  signIn,
  async current() {
    const result = await authClient.getSession();
    return result.data?.user ?? null;
  },
});
