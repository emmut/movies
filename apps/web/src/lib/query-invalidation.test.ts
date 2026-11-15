import { accountQueryKey } from '@movies/api/account-query-key';
import { createApiQueryUtils } from '@movies/api/query-utils';
import type { AppRouterClient } from '@movies/api/router';
import { createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';
import { QueryClient } from '@tanstack/react-query';
import { expect, it } from 'vite-plus/test';

import { invalidateAccountQueriesOnReturn } from './query-invalidation';

it('refreshes canonical account keys on return without invalidating public catalog data', async () => {
  const client: AppRouterClient = createORPCClient(
    new RPCLink({ url: 'http://localhost/api/rpc' }),
  );
  const api = createApiQueryUtils(client);
  const queries = new QueryClient();
  const accountKeys = [
    accountQueryKey(api.preferences.region.queryKey(), 'owner'),
    accountQueryKey(api.customLists.index.queryKey({ input: { page: 1 } }), 'owner'),
    accountQueryKey(
      api.systemLists.memberships.queryKey({ input: { resourceId: 42, resourceType: 'movie' } }),
      'owner',
    ),
  ];
  const catalogKey = api.home.list.queryKey({
    input: { category: 'now-playing-movies', region: 'SE' },
  });
  for (const key of [...accountKeys, catalogKey]) queries.setQueryData(key, []);
  await invalidateAccountQueriesOnReturn(queries);
  for (const key of accountKeys) expect(queries.getQueryState(key)?.isInvalidated).toBe(true);
  expect(queries.getQueryState(catalogKey)?.isInvalidated).toBe(false);
});
