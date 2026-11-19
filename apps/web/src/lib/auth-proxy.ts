import 'server-only';
import { ENV } from '@/env';
import { rpcProxyHeaders } from '@/lib/rpc-proxy';

/** Preserve the public cookie/callback domain while Hono executes Better Auth. */
export async function proxyAuth(request: Request) {
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
