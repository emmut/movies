import { accountQueryKey } from '@movies/api/account-query-key';
import { readPasskeys } from '@native/lib/passkeys';
import { useQuery } from '@tanstack/react-query';
import { useIsFocused } from 'expo-router';

export function passkeyKey(userId: string) {
  return accountQueryKey(['passkeys'], userId);
}

export function usePasskeys(userId: string) {
  const focused = useIsFocused();
  return useQuery({
    queryKey: passkeyKey(userId),
    queryFn: readPasskeys,
    enabled: focused,
    staleTime: 0,
    retry: false,
  });
}
