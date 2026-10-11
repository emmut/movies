import type { RegionCode } from '@movies/config/regions';
import { accountQueryKey } from '@native/lib/account-query-key';
import { orpc, queryClient } from '@native/lib/api';
import { authClient } from '@native/lib/auth-client';
import { createRegionStore, resolveRegion } from '@native/lib/region-store';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useSyncExternalStore } from 'react';

const sessionRegion = createRegionStore();
const accountRegionKey = orpc.preferences.region.queryKey();

function useSessionRegion() {
  return useSyncExternalStore(
    sessionRegion.subscribe,
    sessionRegion.getSnapshot,
    sessionRegion.getSnapshot,
  );
}
function useAccountSession() {
  const session = authClient.useSession();
  return { session, accountId: session.data?.user.id ?? null };
}
function useAccountId() {
  return useAccountSession().accountId;
}

/** Omitting `retry` keeps the client's default retry policy. */
type RegionQueryOptions = { retry?: false };

export function accountRegionQueryKey(accountId: string | null) {
  return accountQueryKey(accountRegionKey, accountId);
}

/** The account region query; every caller shares one cache entry per account. */
export function accountRegionQueryOptions(accountId: string | null, options: RegionQueryOptions = {}) {
  return {
    ...orpc.preferences.region.queryOptions(options),
    queryKey: accountRegionQueryKey(accountId),
  };
}

/** Saved defaults are private and must never be loaded for a signed-out caller. */
export function useProviderPreferences() {
  const { session, accountId } = useAccountSession();
  const signedIn = Boolean(accountId);
  const query = useQuery({
    ...orpc.preferences.providers.queryOptions({ retry: false }),
    enabled: signedIn,
    queryKey: accountQueryKey(orpc.preferences.providers.queryKey(), accountId),
  });
  const accountRegion = useQuery({
    ...accountRegionQueryOptions(accountId, { retry: false }),
    enabled: signedIn,
  });
  return { signedIn, query, accountRegion, session };
}

/** The region every regional read uses: the account's when signed in. */
export function useRegion() {
  const accountId = useAccountId();
  const signedIn = Boolean(accountId);
  const local = useSessionRegion();
  const account = useQuery({
    ...accountRegionQueryOptions(accountId),
    enabled: signedIn,
  });
  return resolveRegion(local, signedIn ? account.data?.region : undefined);
}

/**
 * Changing the region saves it to the signed-in account, like web settings,
 * so web and native agree. The change shows immediately and rolls back if the
 * save fails.
 */
export function useRegionSetting() {
  const accountId = useAccountId();
  const signedIn = Boolean(accountId);
  const region = useRegion();
  const queryKey = accountRegionQueryKey(accountId);
  const save = useMutation(
    orpc.preferences.setRegion.mutationOptions({
      async onMutate(input) {
        await queryClient.cancelQueries({ queryKey });
        const previous = queryClient.getQueryData(queryKey);
        queryClient.setQueryData(queryKey, input);
        return { previous };
      },
      onError(_error, _input, context) {
        if (context?.previous) {
          queryClient.setQueryData(queryKey, context.previous);
        }
      },
      async onSettled() {
        await queryClient.invalidateQueries({ queryKey });
      },
    }),
  );
  function setRegion(next: RegionCode) {
    sessionRegion.setRegion(next);
    if (signedIn) {
      save.mutate({ region: next });
    }
  }
  return { region, setRegion, saveFailed: save.isError };
}

/** Signing out returns the session to the default region. */
export function resetSessionRegion(region: RegionCode) {
  sessionRegion.setRegion(region);
}
