import { accountQueryKey } from '@native/lib/account-query-key';
import { orpc, queryClient } from '@native/lib/api';

export async function refreshCustomLists(userId: string) {
  await queryClient.invalidateQueries({
    queryKey: accountQueryKey(orpc.customLists.key(), userId),
  });
}
