import { headers } from 'next/headers';
import { cache } from 'react';
import { auth } from './auth';
import { getUserWatchlist as getWatchlistData } from './watchlist';

/**
 * Retrieves the current authentication session using the request headers.
 *
 * @returns The current session object, or null if no session exists.
 */
export const getSession = cache(async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session;
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
 * Retrieves the authenticated user's watchlist data.
 * Re-exported from watchlist module for convenience in auth context.
 */
export const getUserWatchlist = getWatchlistData;
