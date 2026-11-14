import type { AppRouterClient } from '@movies/api/router';
import { accountQueryKey } from '@native/lib/account-query-key';
import { orpc } from '@native/lib/api';
import { useQuery, keepPreviousData } from '@tanstack/react-query';

export function useCustomListsDetails(
  userId: string,
  input: Parameters<AppRouterClient['customLists']['details']>[0],
) {
  return useQuery({
    ...orpc.customLists.details.queryOptions({ input, retry: false }),
    queryKey: accountQueryKey(orpc.customLists.details.queryKey({ input }), userId),
    placeholderData: keepPreviousData,
  });
}

export function useCustomListsIndex(
  userId: string,
  input: Parameters<AppRouterClient['customLists']['index']>[0],
) {
  return useQuery({
    ...orpc.customLists.index.queryOptions({ input, retry: false }),
    queryKey: accountQueryKey(orpc.customLists.index.queryKey({ input }), userId),
    placeholderData: keepPreviousData,
  });
}

export function useCustomListsStatus(
  userId: string,
  input: Parameters<AppRouterClient['customLists']['status']>[0],
) {
  return useQuery({
    ...orpc.customLists.status.queryOptions({ input, retry: false }),
    queryKey: accountQueryKey(orpc.customLists.status.queryKey({ input }), userId),
  });
}
