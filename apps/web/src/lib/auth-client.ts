import { passkeyClient } from '@better-auth/passkey/client';
import { runPasskeyCall } from '@movies/api/passkeys';
import { anonymousClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

import { ENV } from '@/env';
import { clearPendingGreet, markPendingGreet } from '@/lib/pending-greet';

import { getSafeRedirectUrl } from './utils';

const authClient = createAuthClient({
  baseURL: ENV.NEXT_PUBLIC_BASE_URL,
  plugins: [anonymousClient(), passkeyClient()],
});

export const { useSession } = authClient;

/**
 * Initiates a Discord social sign-in flow, redirecting the user to Discord for authentication.
 *
 * The user is redirected to Discord and, upon completion, returned to the provided redirect URL if successful, or to a fixed error URL on failure.
 *
 * @param redirectUrl - The URL to redirect to after successful authentication
 * @returns The result of the sign-in operation, or an error object if the process fails
 */
export async function signInDiscord(redirectUrl: string) {
  try {
    const callbackURL = getSafeRedirectUrl(redirectUrl);
    const errorCallbackURL = '/login?error=failed_to_login';

    const data = await authClient.signIn.social(
      {
        provider: 'discord',
        callbackURL,
        errorCallbackURL,
      },
      {
        onRequest: () => markPendingGreet(),
        onError: () => clearPendingGreet(),
      },
    );

    return data;
  } catch (error) {
    console.error('Failed to sign in with Discord:', error);
    return { error: 'Failed to sign in with Discord', data: null };
  }
}

/**
 * Initiates a Discord sign-in flow for linking an account in user settings.
 *
 * Redirects the user to Discord for authentication. On success, the user is redirected to the provided safe URL; on failure, to the settings page with an error message.
 *
 * @param redirectUrl - The URL to redirect to after successful authentication
 * @returns The result of the sign-in operation, or an error object if the process fails
 */
export async function signInSettings(redirectUrl: string) {
  try {
    const safeRedirectUrl = getSafeRedirectUrl(redirectUrl);
    const data = await authClient.signIn.social({
      provider: 'discord',
      callbackURL: safeRedirectUrl,
      errorCallbackURL: '/settings?error=failed_to_link_account',
    });

    if (data?.error) {
      throw data.error;
    }

    return data;
  } catch (error) {
    console.error('Failed to sign in with Discord:', error);
    return { error: 'Failed to sign in with Discord', data: null };
  }
}

/**
 * Registers a new passkey on the signed-in user's account.
 *
 * @param name - Label shown in the passkey list
 */
export async function addPasskey(name: string) {
  return runPasskeyCall('add passkey', () => authClient.passkey.addPasskey({ name }));
}

/**
 * Signs in with a discoverable passkey. No username is needed: the browser
 * lists the passkeys it holds for this site.
 */
export async function signInPasskey() {
  return runPasskeyCall('sign in with passkey', () =>
    authClient.signIn.passkey(undefined, {
      onRequest: () => markPendingGreet(),
      onError: () => clearPendingGreet(),
    }),
  );
}

/**
 * Renames one of the signed-in user's passkeys.
 */
export async function renamePasskey(id: string, name: string) {
  return runPasskeyCall('rename passkey', () => authClient.passkey.updatePasskey({ id, name }));
}

/**
 * Deletes one of the signed-in user's passkeys.
 */
export async function deletePasskey(id: string) {
  return runPasskeyCall('delete passkey', () => authClient.passkey.deletePasskey({ id }));
}

/**
 * Initiates a GitHub social sign-in flow, redirecting the user to GitHub for authentication.
 *
 * @param redirectUrl - The URL to redirect to after successful authentication
 * @returns The result of the sign-in operation, or an error object if the process fails
 */
export async function signInGitHub(redirectUrl: string) {
  try {
    const callbackURL = getSafeRedirectUrl(redirectUrl);
    const errorCallbackURL = '/login?error=failed_to_login';

    const data = await authClient.signIn.social(
      {
        provider: 'github',
        callbackURL,
        errorCallbackURL,
      },
      {
        onRequest: () => markPendingGreet(),
        onError: () => clearPendingGreet(),
      },
    );

    if (data?.error) {
      throw data.error;
    }

    return data;
  } catch (error) {
    console.error('Failed to sign in with GitHub:', error);
    return { error: 'Failed to sign in with GitHub', data: null };
  }
}

/**
 * Initiates a GitHub sign-in flow for linking an account in user settings.
 *
 * Redirects the user to GitHub for authentication. On success, the user is redirected to the provided safe URL; on failure, to the settings page with an error message.
 *
 * @param redirectUrl - The URL to redirect to after successful authentication
 * @returns The result of the sign-in operation, or an error object if the process fails
 */
export async function signInGitHubSettings(redirectUrl: string) {
  try {
    const safeRedirectUrl = getSafeRedirectUrl(redirectUrl);
    const data = await authClient.signIn.social({
      provider: 'github',
      callbackURL: safeRedirectUrl,
      errorCallbackURL: '/settings?error=failed_to_link_account',
    });

    if (data?.error) {
      throw data.error;
    }

    return data;
  } catch (error) {
    console.error('Failed to sign in with GitHub:', error);
    return { error: 'Failed to sign in with GitHub', data: null };
  }
}

export async function signInAnonymous() {
  try {
    const data = await authClient.signIn.anonymous(undefined, {
      onRequest: () => markPendingGreet(),
      onError: () => clearPendingGreet(),
    });

    if (data?.error) {
      throw data.error;
    }

    return data;
  } catch (error) {
    console.error('Failed to sign in anonymously:', error);
    return { error: 'Failed to sign in anonymously', data: null };
  }
}

/**
 * Signs the current user out of their session.
 *
 * @returns The result of the sign-out operation.
 */
export async function signOut() {
  try {
    const data = await authClient.signOut();

    if (data?.error) {
      throw data.error;
    }

    return data;
  } catch (error) {
    console.error('Failed to sign out:', error);
    return { error: 'Failed to sign out', data: null };
  }
}
