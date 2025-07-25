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
  try {
    const data = await authClient.signIn.social({
      provider: 'discord',
      callbackURL: '/',
      errorCallbackURL: '/login?error=failed_to_login',
    });

    return data;
  } catch (error) {
    console.error('Failed to sign in with Discord:', error);
    return { error: 'Failed to sign in with Discord', data: null };
  }
}

/**
 * Initiates a Discord social sign-in flow for account linking in settings.
 *
 * Redirects the user to Discord for authentication. On success, the user is redirected to the home page; on failure, to the settings page with an error message.
 * @returns The result of the sign-in operation.
 */
export async function signInSettings() {
  try {
    const data = await authClient.signIn.social({
      provider: 'discord',
      callbackURL: '/',
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
      email,
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
 * Initiates a GitHub social sign-in flow and returns the authentication result.
 *
 * The user is redirected to GitHub for authentication. Upon completion, the user is redirected to the specified callback URLs based on the outcome.
 *
 * @returns The result of the sign-in operation.
 */
export async function signInGitHub() {
  try {
    const data = await authClient.signIn.social({
      provider: 'github',
      callbackURL: '/',
      errorCallbackURL: '/login?error=failed_to_login',
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
 * Initiates a GitHub social sign-in flow for account linking in settings.
 *
 * Redirects the user to GitHub for authentication. On success, the user is redirected to the home page; on failure, to the settings page with an error message.
 * @returns The result of the sign-in operation.
 */
export async function signInGitHubSettings() {
  try {
    const data = await authClient.signIn.social({
      provider: 'github',
      callbackURL: '/',
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
