import {
  useSystemListsMemberships,
  useSystemListsToggleMutation,
} from '@movies/api/react/use-system-lists-query';
import type { SystemListResourceInput } from '@movies/api/system-lists';
import { authClient } from '@native/lib/auth-client';

export function useSystemListMembership(input: SystemListResourceInput) {
  const session = authClient.useSession();
  const query = useSystemListsMemberships(session.data?.user.id ?? null, input);
  return { session, query };
}

export function useSystemListToggle(userId: string) {
  return useSystemListsToggleMutation({ accountId: userId });
}
