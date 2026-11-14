import type { AppRouterClient } from '@movies/api/router';
import { accountQueryKey } from '@native/lib/account-query-key';
import { orpc } from '@native/lib/api';
import { useQuery, keepPreviousData } from '@tanstack/react-query';

export function useSystemListsOptions(
  userId: string,
  input: Parameters<AppRouterClient['systemLists']['options']>[0],
) {
  return useQuery({
    ...orpc.systemLists.options.queryOptions({ input, retry: false }),
    queryKey: accountQueryKey(orpc.systemLists.options.queryKey({ input }), userId),
  });
}

export function useSystemListsPage(
  userId: string,
  input: Parameters<AppRouterClient['systemLists']['page']>[0],
) {
  return useQuery({
    ...orpc.systemLists.page.queryOptions({ input, retry: false }),
    placeholderData: keepPreviousData,
    queryKey: accountQueryKey(orpc.systemLists.page.queryKey({ input }), userId),
  });
}
