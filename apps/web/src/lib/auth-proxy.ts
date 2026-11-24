import 'server-only';
import { hasAuthProxyMetadata } from '@movies/auth/proxy';

import { ENV } from '@/env';
import { rpcProxyHeaders } from '@/lib/rpc-proxy';

/** Preserve the public cookie/callback domain while Hono executes Better Auth. */
export async function proxyAuth(request: Request) {
  // During a joint rollout, the old API can send this request back to web.
  // Reject that second hop until the API is upgraded, instead of proxying again.
  if (hasAuthProxyMetadata(request.headers)) {
    return Response.json(
      {
        code: 'AUTH_DEPLOYING',
        message: 'Authentication is restarting. Please try again shortly.',
      },
      { status: 503, headers: { 'Retry-After': '5', 'Cache-Control': 'no-store' } },
    );
  }
  const source = new URL(request.url);
  const target = new URL(source.pathname + source.search, ENV.API_URL);
  const headers = rpcProxyHeaders(request.headers, request.method, source.pathname);
  for (const name of ['origin', 'expo-origin', 'user-agent', 'x-skip-oauth-proxy']) {
    const value = request.headers.get(name);
    if (value) {
      headers.set(name, value);
    }
  }
  const response = await fetch(target, {
    method: request.method,
    headers,
    body: request.method === 'GET' ? undefined : await request.arrayBuffer(),
    redirect: 'manual',
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
  });
  const responseHeaders = new Headers(response.headers);
  responseHeaders.delete('content-encoding');
  responseHeaders.delete('content-length');
  responseHeaders.delete('transfer-encoding');
  responseHeaders.set('cache-control', 'no-store');
  return new Response(response.body, { status: response.status, headers: responseHeaders });
}
