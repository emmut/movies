import 'server-only';
import { sessionUserSchema, type SessionUser } from '@movies/api/session';
import type { Auth } from '@movies/auth';
import { AUTH_CLIENT_IP_HEADER, verifiedProxyIp } from '@movies/auth/proxy';

/** The small Better Auth surface used by Hono; no session-token implementation lives here. */
export type AuthHost = Pick<Auth, 'handler'> & {
  api: {
    getSession(input: { headers: Headers; query: { disableCookieCache: boolean } }): Promise<{
      user: Omit<SessionUser, 'image' | 'isAnonymous'> & {
        image?: string | null;
        isAnonymous?: boolean | null;
      };
    } | null>;
  };
};

/** Only the ingress peer or a signed web proxy can assert the rate-limit IP. */
export function authHeaders(
  request: Request,
  secret?: string,
  clientIp?: () => string | undefined,
) {
  const forwarded = secret ? verifiedProxyIp(request, secret) : undefined;
  const headers = new Headers(request.headers);
  for (const name of [
    AUTH_CLIENT_IP_HEADER,
    'x-movies-auth-ip-signature',
    'x-movies-auth-ip-time',
    'x-real-ip',
    'x-forwarded-for',
  ]) {
    headers.delete(name);
  }
  const ip = forwarded ?? clientIp?.();
  if (ip) {
    headers.set(AUTH_CLIENT_IP_HEADER, ip);
  }
  return headers;
}

export function authRequest(
  request: Request,
  secret?: string,
  clientIp?: () => string | undefined,
) {
  return new Request(request, { headers: authHeaders(request, secret, clientIp) });
}

/** Better Auth checks the database locally, including revocations hidden by cookie caches. */
export async function currentUser(auth: AuthHost, headers: Headers) {
  const session = await auth.api.getSession({
    headers,
    query: { disableCookieCache: true },
  });
  if (!session) {
    return null;
  }
  return sessionUserSchema.parse({
    ...session.user,
    image: session.user.image ?? null,
    isAnonymous: session.user.isAnonymous ?? false,
  });
}
