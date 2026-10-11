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
function useAccountId() {
  const { data } = authClient.useSession();
  return data?.user.id ?? null;
}

/** Saved defaults are private and must never be loaded for a signed-out caller. */
export function useProviderPreferences() {
  const session = authClient.useSession();
  const signedIn = Boolean(session.data?.user.id);
  const query = useQuery({
    ...orpc.preferences.providers.queryOptions({ retry: false }),
    enabled: signedIn,
    queryKey: accountQueryKey(orpc.preferences.providers.queryKey(), session.data?.user.id ?? null),
  });
  const accountRegion = useQuery({
    ...orpc.preferences.region.queryOptions({ retry: false }),
    enabled: signedIn,
    queryKey: accountQueryKey(accountRegionKey, session.data?.user.id ?? null),
  });
  return { signedIn, query, accountRegion, session };
}

/** The region every regional read uses: the account's when signed in. */
export function useRegion() {
  const accountId = useAccountId();
  const signedIn = Boolean(accountId);
  const local = useSessionRegion();
  const account = useQuery({
    ...orpc.preferences.region.queryOptions(),
    enabled: signedIn,
    queryKey: accountQueryKey(accountRegionKey, accountId),
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
  const queryKey = accountQueryKey(accountRegionKey, accountId);
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
