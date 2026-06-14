import { QueryClient } from '@tanstack/react-query';
import { beforeEach, describe, expect, it } from 'vitest';

import { queryKeys } from './query-keys';
import { invalidateUserPreferenceQueries } from './query-invalidation';

const regionKey = queryKeys.user.region();
const watchProvidersKey = queryKeys.user.watchProviders('SE');
const homeListKey = queryKeys.home.list('now-playing-movies', 'SE');
const unrelatedKey = queryKeys.search.movies('matrix', 1);

function isInvalidated(queryClient: QueryClient, key: readonly unknown[]) {
  return queryClient.getQueryState(key)?.isInvalidated === true;
}

describe('invalidateUserPreferenceQueries', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient();
    // Seed fresh (non-invalidated) cache entries the settings forms depend on,
    // plus an unrelated query that must stay untouched.
    queryClient.setQueryData(regionKey, 'SE');
    queryClient.setQueryData(watchProvidersKey, []);
    queryClient.setQueryData(homeListKey, []);
    queryClient.setQueryData(unrelatedKey, { movies: [], totalPages: 1 });
  });

  it('invalidates the user queries but not home or unrelated queries by default', async () => {
    await invalidateUserPreferenceQueries(queryClient);

    expect(isInvalidated(queryClient, regionKey)).toBe(true);
    expect(isInvalidated(queryClient, watchProvidersKey)).toBe(true);
    expect(isInvalidated(queryClient, homeListKey)).toBe(false);
    expect(isInvalidated(queryClient, unrelatedKey)).toBe(false);
  });

  it('also invalidates the home list queries when includeHomeLists is set', async () => {
    await invalidateUserPreferenceQueries(queryClient, { includeHomeLists: true });

    expect(isInvalidated(queryClient, regionKey)).toBe(true);
    expect(isInvalidated(queryClient, watchProvidersKey)).toBe(true);
    expect(isInvalidated(queryClient, homeListKey)).toBe(true);
    expect(isInvalidated(queryClient, unrelatedKey)).toBe(false);
  });
});
