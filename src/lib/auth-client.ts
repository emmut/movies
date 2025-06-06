import { createAuthClient } from 'better-auth/react';

const authClient = createAuthClient();

export const { useSession } = authClient;

export type Session = typeof authClient.$Infer.Session;

/**
 * Initiates a Discord social sign-in flow and returns the authentication result.
 *
 * The user is redirected to Discord for authentication. Upon completion, the user is redirected to the specified callback URLs based on the outcome.
 *
 * @returns The result of the sign-in operation.
 */
export async function signIn() {
  const data = await authClient.signIn.social({
    provider: 'discord',
    callbackURL: '/',
    errorCallbackURL: '/',
    newUserCallbackURL: '/',
  });

  return data;
}

/**
 * Signs the current user out of their session.
 *
 * @returns The result of the sign-out operation.
 */
export async function signOut() {
  const data = await authClient.signOut();

  return data;
}
