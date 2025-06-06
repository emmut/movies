import { createAuthClient } from 'better-auth/react';

const authClient = createAuthClient();

export const { useSession } = authClient;

export type Session = typeof authClient.$Infer.Session;

export async function signIn() {
  const data = await authClient.signIn.social({
    provider: 'discord',
    callbackURL: '/',
    errorCallbackURL: '/',
    newUserCallbackURL: '/',
  });

  return data;
}

export async function signOut() {
  const data = await authClient.signOut();

  return data;
}
