'use client';

import { accountQueryKey } from '@movies/api/account-query-key';
import { useEffectiveAccountId, useApi } from '@movies/api/react';
import type { AppRouterClient } from '@movies/api/router';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';

import { useAccountMutation, type AccountMutationOptions } from './use-account-mutation';

export function usePreferencesProviders(userId: string | null) {
  const orpc = useApi();
  const accountId = useEffectiveAccountId(userId);
  return useQuery({
    ...orpc.preferences.providers.queryOptions({ retry: false, enabled: Boolean(accountId) }),
    queryKey: accountQueryKey(orpc.preferences.providers.queryKey(), accountId),
  });
}

export function usePreferencesProviderOptions(
  userId: string | null,
  input: Parameters<AppRouterClient['preferences']['providerOptions']>[0],
) {
  const orpc = useApi();
  const accountId = useEffectiveAccountId(userId);
  return useQuery({
    ...orpc.preferences.providerOptions.queryOptions({
      input,
      retry: false,
      enabled: Boolean(accountId),
    }),
    queryKey: accountQueryKey(orpc.preferences.providerOptions.queryKey({ input }), accountId),
  });
}

export function useAccountRegion(
  userId: string | null,
  options: { retry?: false; enabled?: boolean } = { retry: false },
) {
  const orpc = useApi();
  const accountId = useEffectiveAccountId(userId);
  return useQuery({
    ...orpc.preferences.region.queryOptions({
      ...options,
      enabled: options.enabled !== false && Boolean(accountId),
    }),
    queryKey: accountQueryKey(orpc.preferences.region.queryKey(), accountId),
  });
}

export function useOptimisticRegionMutation(userId: string | null, settled: () => void) {
  const api = useApi();
  const accountId = useEffectiveAccountId(userId);
  const queryClient = useQueryClient();
  const queryKey = accountQueryKey(api.preferences.region.queryKey(), accountId);
  return useMutation(
    api.preferences.setRegion.mutationOptions({
      async onMutate(input) {
        await queryClient.cancelQueries({ queryKey });
        const previous = queryClient.getQueryData(queryKey);
        queryClient.setQueryData(queryKey, input);
        return { previous, queryKey };
      },
      async onError(_error, _input, context) {
        if (!context) {
          return;
        }
        if (context.previous !== undefined) {
          queryClient.setQueryData(context.queryKey, context.previous);
        } else {
          await queryClient.resetQueries({ queryKey: context.queryKey, exact: true });
        }
      },
      async onSettled(_result, _error, _input, context) {
        try {
          await queryClient.invalidateQueries({ queryKey: context?.queryKey ?? queryKey });
        } finally {
          settled();
        }
      },
    }),
  );
}

export function usePreferencesSetRegionMutation(
  options: AccountMutationOptions<
    Parameters<AppRouterClient['preferences']['setRegion']>[0],
    Awaited<ReturnType<AppRouterClient['preferences']['setRegion']>>
  > = {},
) {
  const api = useApi();
  return useAccountMutation(api.preferences.setRegion, options);
}

export function usePreferencesSetProvidersMutation(
  options: AccountMutationOptions<
    Parameters<AppRouterClient['preferences']['setProviders']>[0],
    Awaited<ReturnType<AppRouterClient['preferences']['setProviders']>>
  > = {},
) {
  const api = useApi();
  return useAccountMutation(api.preferences.setProviders, options);
}
