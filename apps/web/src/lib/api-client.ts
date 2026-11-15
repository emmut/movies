'use client';
import { createApiQueryUtils } from '@movies/api/query-utils';
import type { AppRouterClient } from '@movies/api/router';
import { createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';

const client: AppRouterClient = createORPCClient(
  new RPCLink({
    url: () => new URL('/api/rpc', window.location.origin),
    fetch(request, init) {
      return fetch(request, { ...init, credentials: 'same-origin' });
    },
  }),
);
export const api = createApiQueryUtils(client);
