import { createAuthClient } from 'better-auth/client';
const authClient = createAuthClient();

export async function signIn() {
  const data = await authClient.signIn.social({
    provider: 'discord',
    callbackURL: '/',
    errorCallbackURL: '/',
    newUserCallbackURL: '/',
  });
}

export async function signOut() {
  const data = await authClient.signOut();
}
