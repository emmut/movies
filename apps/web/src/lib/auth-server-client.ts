import 'server-only';
import { passkeyClient } from '@better-auth/passkey/client';
import { createAuthClient } from 'better-auth/client';
import { anonymousClient } from 'better-auth/client/plugins';

import { ENV } from '@/env';
import { rpcProxyHeaders } from '@/lib/rpc-proxy';

/** Server rendering uses the official SDK against the internal Hono origin. */
export const serverAuthClient = createAuthClient({
  baseURL: ENV.API_URL,
  plugins: [anonymousClient(), passkeyClient()],
  fetchOptions: {
    cache: 'no-store',
    redirect: 'error',
    timeout: 15_000,
    customFetchImpl(input, init) {
      const request = new Request(input, init);
      return fetch(request, {
        headers: rpcProxyHeaders(request.headers, request.method, new URL(request.url).pathname),
      });
    },
  },
});
