import 'server-only';
import type { AppRouterClient } from '@movies/api/router';
import { createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';

import { ENV } from '@/env';

/** All product execution belongs to Hono, including metadata and server prefetches. */
export function createServerApi(headers: Headers): AppRouterClient {
  const cookie = headers.get('cookie');
  return createORPCClient(
    new RPCLink({
      url: new URL('/rpc', ENV.API_URL),
      headers: cookie ? { cookie } : {},
      fetch(request, init) {
        return fetch(request, { ...init, cache: 'no-store', redirect: 'error' });
      },
    }),
  );
}
