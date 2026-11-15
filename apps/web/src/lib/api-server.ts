import 'server-only';
import type { AppRouterClient } from '@movies/api/router';
import { createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';

import { ENV } from '@/env';
import { rpcProxyHeaders } from '@/lib/rpc-proxy';

/** All product execution belongs to Hono, including metadata and server prefetches. */
export function createServerApi(headers: Headers): AppRouterClient {
  return createORPCClient(
    new RPCLink({
      url: new URL('/rpc', ENV.API_URL),
      fetch(request, init) {
        const forwarded = new Headers(request.headers);
        rpcProxyHeaders(
          headers,
          request.method,
          new URL(request.url).pathname,
          request.headers,
        ).forEach((value, name) => forwarded.set(name, value));
        return fetch(request, {
          ...init,
          headers: forwarded,
          cache: 'no-store',
          redirect: 'error',
        });
      },
    }),
  );
}
