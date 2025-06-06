import { headers } from 'next/headers';
import { auth } from './auth';

/**
 * Retrieves the current authentication session using the request headers.
 *
 * @returns The current session object, or null if no session exists.
 */
export async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session;
}

/**
 * Retrieves the authenticated user from the current session.
 *
 * @returns The user object from the session, or `null` if no user is authenticated.
 */
export async function getUser() {
  const session = await getSession();
  return session?.user ?? null;
}
