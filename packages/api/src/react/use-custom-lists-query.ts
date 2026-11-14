'use client';

import { accountQueryKey, accountPlaceholderData } from '@movies/api/account-query-key';
import { useEffectiveAccountId, useApi } from '@movies/api/react';
import type { AppRouterClient } from '@movies/api/router';
import { useQuery } from '@tanstack/react-query';

import { useAccountMutation, type AccountMutationOptions } from './use-account-mutation';

export function useCustomListsDetails(
  userId: string | null,
  input: Parameters<AppRouterClient['customLists']['details']>[0],
) {
  const orpc = useApi();
  const accountId = useEffectiveAccountId(userId);
  return useQuery({
    ...orpc.customLists.details.queryOptions({ input, retry: false, enabled: Boolean(accountId) }),
    queryKey: accountQueryKey(orpc.customLists.details.queryKey({ input }), accountId),
    placeholderData: (previous, query) => accountPlaceholderData(previous, query, accountId),
  });
}

export function useCustomListsIndex(
  userId: string | null,
  input: Parameters<AppRouterClient['customLists']['index']>[0],
) {
  const orpc = useApi();
  const accountId = useEffectiveAccountId(userId);
  return useQuery({
    ...orpc.customLists.index.queryOptions({ input, retry: false, enabled: Boolean(accountId) }),
    queryKey: accountQueryKey(orpc.customLists.index.queryKey({ input }), accountId),
    placeholderData: (previous, query) => accountPlaceholderData(previous, query, accountId),
  });
}

export function useCustomListsStatus(
  userId: string | null,
  input: Parameters<AppRouterClient['customLists']['status']>[0],
  enabled = true,
) {
  const orpc = useApi();
  const accountId = useEffectiveAccountId(userId);
  return useQuery({
    ...orpc.customLists.status.queryOptions({
      input,
      retry: false,
      enabled: enabled && Boolean(accountId),
    }),
    queryKey: accountQueryKey(orpc.customLists.status.queryKey({ input }), accountId),
  });
}

export function useCustomListsCreateMutation(
  options: AccountMutationOptions<
    Parameters<AppRouterClient['customLists']['create']>[0],
    Awaited<ReturnType<AppRouterClient['customLists']['create']>>
  > = {},
) {
  const api = useApi();
  return useAccountMutation(api.customLists.create, options);
}

export function useCustomListsUpdateMutation(
  options: AccountMutationOptions<
    Parameters<AppRouterClient['customLists']['update']>[0],
    Awaited<ReturnType<AppRouterClient['customLists']['update']>>
  > = {},
) {
  const api = useApi();
  return useAccountMutation(api.customLists.update, options);
}

export function useCustomListsDeleteMutation(
  options: AccountMutationOptions<
    Parameters<AppRouterClient['customLists']['delete']>[0],
    Awaited<ReturnType<AppRouterClient['customLists']['delete']>>
  > = {},
) {
  const api = useApi();
  return useAccountMutation(api.customLists.delete, options);
}

export function useCustomListsAddMutation(
  options: AccountMutationOptions<
    Parameters<AppRouterClient['customLists']['add']>[0],
    Awaited<ReturnType<AppRouterClient['customLists']['add']>>
  > = {},
) {
  const api = useApi();
  return useAccountMutation(api.customLists.add, options);
}

export function useCustomListsRemoveMutation(
  options: AccountMutationOptions<
    Parameters<AppRouterClient['customLists']['remove']>[0],
    Awaited<ReturnType<AppRouterClient['customLists']['remove']>>
  > = {},
) {
  const api = useApi();
  return useAccountMutation(api.customLists.remove, options);
}

export function useCustomListsMoveMutation(
  options: AccountMutationOptions<
    Parameters<AppRouterClient['customLists']['move']>[0],
    Awaited<ReturnType<AppRouterClient['customLists']['move']>>
  > = {},
) {
  const api = useApi();
  return useAccountMutation(api.customLists.move, options);
}

export function useCustomListsMoveItemMutation(
  options: AccountMutationOptions<
    Parameters<AppRouterClient['customLists']['moveItem']>[0],
    Awaited<ReturnType<AppRouterClient['customLists']['moveItem']>>
  > = {},
) {
  const api = useApi();
  return useAccountMutation(api.customLists.moveItem, options);
}
