import 'server-only';
import type { Session } from '@movies/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';

import { serverAuthClient } from './auth-server-client';

/**
 * Retrieves the current authentication session using the request headers.
 *
 * @returns The current session object, or null if no session exists.
 */
export const getSession = cache(async (): Promise<Session | null> => {
  const { data, error } = await serverAuthClient.getSession({
    fetchOptions: { headers: await headers() },
  });
  if (error) {
    throw new Error('Could not read authentication session', { cause: error });
  }
  return data;
});

/**
 * Retrieves the authenticated user from the current session.
 *
 * @returns The user object from the session, or `null` if no user is authenticated.
 */
export async function getUser() {
  const session = await getSession();
  return session?.user ?? null;
}

/**
 * Retrieves the authenticated user, redirecting to the login page when none is present.
 *
 * @returns The authenticated user. Never returns when unauthenticated (redirects instead).
 */
export async function requireUser() {
  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  return user;
}
