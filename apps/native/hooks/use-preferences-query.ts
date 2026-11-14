import type { AppRouterClient } from '@movies/api/router';
import { accountQueryKey } from '@native/lib/account-query-key';
import { orpc } from '@native/lib/api';
import { accountRegionQueryOptions } from '@native/lib/preferences';
import { useQuery } from '@tanstack/react-query';

export function usePreferencesProviders(userId: string) {
  return useQuery({
    ...orpc.preferences.providers.queryOptions({ retry: false }),
    queryKey: accountQueryKey(orpc.preferences.providers.queryKey(), userId),
  });
}

export function usePreferencesProviderOptions(
  userId: string,
  input: Parameters<AppRouterClient['preferences']['providerOptions']>[0],
) {
  return useQuery({
    ...orpc.preferences.providerOptions.queryOptions({ input, retry: false }),
    queryKey: accountQueryKey(orpc.preferences.providerOptions.queryKey({ input }), userId),
  });
}

export function useAccountRegion(userId: string) {
  return useQuery(accountRegionQueryOptions(userId, { retry: false }));
}
