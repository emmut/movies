import { ENV } from '@/env';
import { rpcProxyHeaders } from '@/lib/rpc-proxy';

function apiEndpoint(request: Request) {
  const source = new URL(request.url);
  const target = new URL(ENV.API_URL);
  target.pathname = source.pathname.replace(/^\/api\/rpc(?=\/|$)/, '/rpc');
  target.search = source.search;
  return target;
}

function proxyResponse(response: Response) {
  const headers = new Headers({ 'Cache-Control': 'no-store' });
  const contentType = response.headers.get('content-type');
  if (contentType) {
    headers.set('content-type', contentType);
  }
  return new Response(response.body, { status: response.status, headers });
}

/** oRPC uses POST for product reads and writes. GET cannot execute mutations. */
export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(ENV.NEXT_PUBLIC_BASE_URL).origin) {
    return new Response('Forbidden', { status: 403 });
  }
  const target = apiEndpoint(request);
  const response = await fetch(target, {
    method: 'POST',
    headers: rpcProxyHeaders(request.headers, 'POST', target.pathname),
    body: await request.arrayBuffer(),
    cache: 'no-store',
    redirect: 'manual',
    signal: request.signal,
  });
  return proxyResponse(response);
}
