'use client';

import { useMutation } from '@tanstack/react-query';

import { deletePasskey } from '@/lib/auth-client';

/** Authentication uses the platform SDK; product data uses the shared RPC hooks. */
export function useDeletePasskeyMutation() {
  return useMutation({ mutationKey: ['auth', 'passkey', 'delete'], mutationFn: deletePasskey });
}
