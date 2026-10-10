import type { RegionCode } from '@movies/config/regions';
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
function useSignedIn() {
  const { data } = authClient.useSession();
  return Boolean(data?.user.id);
}

/** The region every regional read uses: the account's when signed in. */
export function useRegion() {
  const signedIn = useSignedIn();
  const local = useSessionRegion();
  const account = useQuery({ ...orpc.preferences.region.queryOptions(), enabled: signedIn });
  return resolveRegion(local, signedIn ? account.data?.region : undefined);
}

/**
 * Changing the region saves it to the signed-in account, like web settings,
 * so web and native agree. The change shows immediately and rolls back if the
 * save fails.
 */
export function useRegionSetting() {
  const signedIn = useSignedIn();
  const region = useRegion();
  const save = useMutation(
    orpc.preferences.setRegion.mutationOptions({
      async onMutate(input) {
        await queryClient.cancelQueries({ queryKey: accountRegionKey });
        const previous = queryClient.getQueryData(accountRegionKey);
        queryClient.setQueryData(accountRegionKey, input);
        return { previous };
      },
      onError(_error, _input, context) {
        if (context?.previous) {
          queryClient.setQueryData(accountRegionKey, context.previous);
        }
      },
      async onSettled() {
        await queryClient.invalidateQueries({ queryKey: accountRegionKey });
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
