'use client';

import { accountQueryKey, accountPlaceholderData } from '@movies/api/account-query-key';
import { useEffectiveAccountId, useApi } from '@movies/api/react';
import type { AppRouterClient } from '@movies/api/router';
import { useQuery } from '@tanstack/react-query';

import { useAccountMutation, type AccountMutationOptions } from './use-account-mutation';

export function useSystemListsOptions(
  userId: string | null,
  input: Parameters<AppRouterClient['systemLists']['options']>[0],
) {
  const orpc = useApi();
  const accountId = useEffectiveAccountId(userId);
  return useQuery({
    ...orpc.systemLists.options.queryOptions({ input, retry: false, enabled: Boolean(accountId) }),
    queryKey: accountQueryKey(orpc.systemLists.options.queryKey({ input }), accountId),
  });
}

export function useSystemListsPage(
  userId: string | null,
  input: Parameters<AppRouterClient['systemLists']['page']>[0],
) {
  const orpc = useApi();
  const accountId = useEffectiveAccountId(userId);
  return useQuery({
    ...orpc.systemLists.page.queryOptions({ input, retry: false, enabled: Boolean(accountId) }),
    placeholderData: (previous, query) => accountPlaceholderData(previous, query, accountId),
    queryKey: accountQueryKey(orpc.systemLists.page.queryKey({ input }), accountId),
  });
}

export function useSystemListsToggleMutation(
  options: AccountMutationOptions<
    Parameters<AppRouterClient['systemLists']['toggle']>[0],
    Awaited<ReturnType<AppRouterClient['systemLists']['toggle']>>
  > = {},
) {
  const api = useApi();
  return useAccountMutation(api.systemLists.toggle, options);
}

export function useSystemListsMoveMutation(
  options: AccountMutationOptions<
    Parameters<AppRouterClient['systemLists']['move']>[0],
    Awaited<ReturnType<AppRouterClient['systemLists']['move']>>
  > = {},
) {
  const api = useApi();
  return useAccountMutation(api.systemLists.move, options);
}

export function useSystemListsMemberships(
  userId: string | null,
  input: Parameters<AppRouterClient['systemLists']['memberships']>[0],
  enabled = true,
) {
  const api = useApi();
  const accountId = useEffectiveAccountId(userId);
  return useQuery({
    ...api.systemLists.memberships.queryOptions({
      input,
      enabled: enabled && Boolean(accountId),
      retry: false,
    }),
    queryKey: accountQueryKey(api.systemLists.memberships.queryKey({ input }), accountId),
  });
}
