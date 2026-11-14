'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useApiAccountId } from './provider';

export type AccountMutationOptions<TInput, TOutput> = {
  accountId?: string | null;
  onSuccess?: (result: TOutput, input: TInput) => void | Promise<void>;
  onSettled?: () => void | Promise<void>;
};

/** Capture the submitting account: a late response must not refresh the next user's cache. */
export function useAccountMutation<TInput, TOutput>(
  operation: { call: (input: TInput) => Promise<TOutput>; mutationKey: () => readonly unknown[] },
  options: AccountMutationOptions<TInput, TOutput> = {},
) {
  const queryClient = useQueryClient();
  const providerAccountId = useApiAccountId();
  const accountId = options.accountId ?? providerAccountId;
  return useMutation({
    mutationKey: operation.mutationKey(),
    mutationFn: operation.call,
    onMutate() {
      return { accountId, onSuccess: options.onSuccess, onSettled: options.onSettled };
    },
    async onSuccess(result, input, submitted) {
      if (submitted?.accountId) {
        await queryClient.invalidateQueries({ queryKey: ['account', submitted.accountId] });
      }
      await submitted?.onSuccess?.(result, input);
    },
    async onSettled(_result, _error, _input, submitted) {
      await submitted?.onSettled?.();
    },
  });
}
