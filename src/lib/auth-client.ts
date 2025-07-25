import { anonymousClient, passkeyClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

const authClient = createAuthClient({
  plugins: [anonymousClient(), passkeyClient()],
});

export const { useSession } = authClient;

export type Session = typeof authClient.$Infer.Session;

/**
 * Initiates a Discord social sign-in flow and returns the authentication result.
 *
 * The user is redirected to Discord for authentication. Upon completion, the user is redirected to the specified callback URLs based on the outcome.
 *
 * @returns The result of the sign-in operation.
 */
export async function signInDiscord() {
  const data = await authClient.signIn.social({
    provider: 'discord',
    callbackURL: '/',
    errorCallbackURL: '/login?error=failed_to_login',
  });

  return data;
}

/**
 * Initiates a Discord social sign-in flow for account linking in settings.
 *
 * Redirects the user to Discord for authentication. On success, the user is redirected to the home page; on failure, to the settings page with an error message.
 * @returns The result of the sign-in operation.
 */
export async function signInSettings() {
  const data = await authClient.signIn.social({
    provider: 'discord',
    callbackURL: '/',
    errorCallbackURL: '/settings?error=failed_to_link_account',
  });

  return data;
}

export async function addPasskey() {
  const data = await authClient.passkey.addPasskey();

  if (data?.error) {
    throw new Error(data.error.message);
  }

export async function signInPasskey(email: string) {
  const data = await authClient.signIn.passkey({
    email,
    autoFill: true,
  });

  if (data?.error) {
    throw new Error(data.error.message);
  }

/**
 * Initiates a GitHub social sign-in flow and returns the authentication result.
 *
 * The user is redirected to GitHub for authentication. Upon completion, the user is redirected to the specified callback URLs based on the outcome.
 *
 * @returns The result of the sign-in operation.
 */
export async function signInGitHub() {
  const data = await authClient.signIn.social({
    provider: 'github',
    callbackURL: '/',
    errorCallbackURL: '/login?error=failed_to_login',
  });

  return data;
}

/**
 * Initiates a GitHub social sign-in flow for account linking in settings.
 *
 * Redirects the user to GitHub for authentication. On success, the user is redirected to the home page; on failure, to the settings page with an error message.
 * @returns The result of the sign-in operation.
 */
export async function signInGitHubSettings() {
  const data = await authClient.signIn.social({
    provider: 'github',
    callbackURL: '/',
    errorCallbackURL: '/settings?error=failed_to_link_account',
  });

  return data;
}

export async function signInAnonymous() {
  const data = await authClient.signIn.anonymous();

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
