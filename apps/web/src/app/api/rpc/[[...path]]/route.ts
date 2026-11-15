import { ENV } from '@/env';

/** Cookie-preserving transport only. Hono validates inputs, sessions and ownership. */
async function handle(request: Request) {
  const source = new URL(request.url);
  const target = new URL(ENV.API_URL);
  target.pathname = source.pathname.replace(/^\/api\/rpc(?=\/|$)/, '/rpc');
  target.search = source.search;
  const headers = new Headers();
  for (const name of ['cookie', 'content-type', 'accept']) {
    const value = request.headers.get(name);
    if (value) {
      headers.set(name, value);
    }
  }
  // Cookie-bearing browser writes must originate from this application.
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(ENV.NEXT_PUBLIC_BASE_URL).origin) {
    return new Response('Forbidden', { status: 403 });
  }
  const response = await fetch(target, {
    method: request.method,
    headers,
    body: request.method === 'GET' ? undefined : await request.arrayBuffer(),
    cache: 'no-store',
    redirect: 'manual',
    signal: request.signal,
  });
  const outgoing = new Headers({ 'Cache-Control': 'no-store' });
  const contentType = response.headers.get('content-type');
  if (contentType) {
    outgoing.set('content-type', contentType);
  }
  return new Response(response.body, { status: response.status, headers: outgoing });
}

export const GET = handle;
export const POST = handle;
