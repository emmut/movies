import 'server-only';
import { sessionUserSchema } from '@movies/api/session';
import { z } from 'zod';

const upstreamSession = z.object({
  user: sessionUserSchema.extend({
    image: sessionUserSchema.shape.image.optional(),
    isAnonymous: z.boolean().nullable().optional(),
  }),
  session: z.object({ expiresAt: z.coerce.date() }),
});
const forwardedHeaders = [
  'cookie',
  'content-type',
  'origin',
  'expo-origin',
  'user-agent',
  'x-skip-oauth-proxy',
];
export type AuthGateway = ReturnType<typeof createAuthGateway>;

/** Web owns auth, OAuth callbacks and anonymous migration; the API never mints its own sessions. */
export function createAuthGateway(baseUrl: string, fetcher: typeof fetch = fetch) {
  const base = new URL(baseUrl);
  if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password) {
    throw new Error('Invalid authentication service URL');
  }
  function endpoint(path: string) {
    return new URL(path, base.origin);
  }
  async function handle(request: Request) {
    const source = new URL(request.url);
    if (!source.pathname.startsWith('/api/auth/')) {
      return new Response('Not found', { status: 404 });
    }
    const headers = new Headers();
    for (const name of forwardedHeaders) {
      const value = request.headers.get(name);
      if (value) {
        headers.set(name, value);
      }
    }
    const target = endpoint(source.pathname);
    target.search = source.search;
    const body =
      request.method === 'GET' || request.method === 'HEAD'
        ? undefined
        : await request.arrayBuffer();
    const response = await fetcher(target, {
      method: request.method,
      headers,
      body,
      redirect: 'manual',
      signal: AbortSignal.timeout(15_000),
    });
    const responseHeaders = new Headers(response.headers);
    responseHeaders.delete('content-encoding');
    responseHeaders.delete('content-length');
    responseHeaders.delete('transfer-encoding');
    responseHeaders.set('Cache-Control', 'no-store');
    return new Response(response.body, { status: response.status, headers: responseHeaders });
  }
  async function current(headers: Headers) {
    const cookie = headers.get('cookie');
    if (!cookie) {
      return null;
    }
    const response = await fetcher(endpoint('/api/auth/get-session?disableCookieCache=true'), {
      headers: { cookie },
      redirect: 'manual',
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) {
      throw new Error('Could not verify the session');
    }
    const raw: unknown = await response.json();
    if (raw === null) {
      return null;
    }
    const data = upstreamSession.parse(raw);
    if (data.session.expiresAt.getTime() <= Date.now()) {
      return null;
    }
    return sessionUserSchema.parse({
      ...data.user,
      image: data.user.image ?? null,
      isAnonymous: data.user.isAnonymous ?? false,
    });
  }
  return { handle, current };
}
