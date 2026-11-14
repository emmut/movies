import { accountQueryKey } from '@movies/api/account-query-key';
import { readPasskeys } from '@native/lib/passkeys';
import { useQuery } from '@tanstack/react-query';

export function passkeyKey(userId: string) {
  return accountQueryKey(['passkeys'], userId);
}

export function usePasskeys(userId: string) {
  return useQuery({ queryKey: passkeyKey(userId), queryFn: readPasskeys, retry: false });
}
