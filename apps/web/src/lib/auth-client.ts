import { passkeyClient } from '@better-auth/passkey/client';
import { anonymousClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

import { env } from '@/env';
import { clearPendingGreet, markPendingGreet } from '@/lib/pending-greet';

import { getSafeRedirectUrl } from './utils';

const authClient = createAuthClient({
  baseURL: env.NEXT_PUBLIC_BASE_URL,
  plugins: [anonymousClient(), passkeyClient()],
});

export const { useSession } = authClient;

type SocialProvider = 'discord' | 'github' | 'google';

async function signInSocial(provider: SocialProvider, redirectUrl: string) {
  try {
    return await authClient.signIn.social(
      {
        provider,
        callbackURL: getSafeRedirectUrl(redirectUrl),
        errorCallbackURL: '/login?error=failed_to_login',
      },
      {
        onRequest: () => markPendingGreet(),
        onError: () => clearPendingGreet(),
      },
    );
  } catch (error) {
    clearPendingGreet();
    console.error(`Failed to sign in with ${provider}:`, error);
    return { error: `Failed to sign in with ${provider}`, data: null };
  }
}

async function signInSocialSettings(provider: SocialProvider, redirectUrl: string) {
  try {
    const data = await authClient.signIn.social({
      provider,
      callbackURL: getSafeRedirectUrl(redirectUrl),
      errorCallbackURL: '/settings?error=failed_to_link_account',
    });
    if (data?.error) {
      throw data.error;
    }
    return data;
  } catch (error) {
    console.error(`Failed to sign in with ${provider}:`, error);
    return { error: `Failed to sign in with ${provider}`, data: null };
  }
}

export function signInDiscord(redirectUrl: string) {
  return signInSocial('discord', redirectUrl);
}

export function signInSettings(redirectUrl: string) {
  return signInSocialSettings('discord', redirectUrl);
}

export function signInGitHub(redirectUrl: string) {
  return signInSocial('github', redirectUrl);
}

export function signInGitHubSettings(redirectUrl: string) {
  return signInSocialSettings('github', redirectUrl);
}

export function signInGoogle(redirectUrl: string) {
  return signInSocial('google', redirectUrl);
}

export function signInGoogleSettings(redirectUrl: string) {
  return signInSocialSettings('google', redirectUrl);
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
    const data = await authClient.signIn.passkey(
      {
        autoFill,
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
    console.warn('Failed to sign in with passkey:', error);
    return { error, data: null };
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
