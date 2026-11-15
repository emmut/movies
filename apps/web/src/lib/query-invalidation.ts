import type { QueryClient } from '@tanstack/react-query';

/** Another client may change account data while this browser is in the background. */
export async function invalidateAccountQueriesOnReturn(queryClient: QueryClient) {
  await queryClient.invalidateQueries({ queryKey: ['account'] });
}
