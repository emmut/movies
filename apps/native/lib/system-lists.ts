import type { SystemListResourceInput } from '@movies/api/system-lists';
import { accountQueryKey } from '@native/lib/account-query-key';
import { orpc, queryClient } from '@native/lib/api';
import { authClient } from '@native/lib/auth-client';
import { useMutation, useQuery } from '@tanstack/react-query';

export function useSystemListMembership(input: SystemListResourceInput) {
  const session = authClient.useSession();
  const userId = session.data?.user.id ?? null;
  const query = useQuery({
    ...orpc.systemLists.memberships.queryOptions({ input, retry: false }),
    enabled: Boolean(userId),
    queryKey: accountQueryKey(orpc.systemLists.memberships.queryKey({ input }), userId),
  });
  return { session, query };
}

export function useSystemListToggle(userId: string) {
  return useMutation(
    orpc.systemLists.toggle.mutationOptions({
      async onSuccess() {
        await queryClient.invalidateQueries({
          queryKey: accountQueryKey(orpc.systemLists.key(), userId),
        });
      },
    }),
  );
}
