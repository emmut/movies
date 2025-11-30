import { passkeyClient } from '@better-auth/passkey/client';
import { anonymousClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';
import { getSafeRedirectUrl } from './utils';

const authClient = createAuthClient({
  plugins: [anonymousClient(), passkeyClient()],
});

export const { useSession } = authClient;

export type Session = typeof authClient.$Infer.Session;

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

    const data = await authClient.signIn.social({
      provider: 'discord',
      callbackURL,
      errorCallbackURL,
    });

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

export async function addPasskey(name: string = 'My Passkey') {
  try {
    const data = await authClient.passkey.addPasskey({
      name,
    });

    if (data?.error) {
      throw data.error;
    }

    return { error: false, data };
  } catch (error) {
    console.error('Failed to add passkey:', error);
    return { error: true, data: null };
  }
}

export async function signInPasskey(email: string, autoFill = false) {
  try {
    const data = await authClient.signIn.passkey({
      autoFill,
    });

    if (data?.error) {
      throw data.error;
    }

    return data;
  } catch (error) {
    console.warn('Failed to sign in with passkey:', error);
    return { error, data: null };
  }
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

    const data = await authClient.signIn.social({
      provider: 'github',
      callbackURL,
      errorCallbackURL,
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
    const data = await authClient.signIn.anonymous();

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
