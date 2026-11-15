import {
  useAccountRegion,
  usePreferencesProviders,
  useOptimisticRegionMutation,
} from '@movies/api/react/use-preferences-query';
import type { RegionCode } from '@movies/config/regions';
import { authClient } from '@native/lib/auth-client';
import { createRegionStore, resolveRegion } from '@native/lib/region-store';
import { useRef, useSyncExternalStore } from 'react';

const sessionRegion = createRegionStore();

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

/** Saved defaults are private and must never be loaded for a signed-out caller. */
export function useProviderPreferences() {
  const { session, accountId } = useAccountSession();
  const signedIn = Boolean(accountId);
  const query = usePreferencesProviders(accountId);
  const accountRegion = useAccountRegion(accountId);
  return { signedIn, query, accountRegion, session };
}

/** The region every regional read uses: the account's when signed in. */
export function useRegion() {
  const accountId = useAccountId();
  const signedIn = Boolean(accountId);
  const local = useSessionRegion();
  const account = useAccountRegion(accountId, {});
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
  const saving = useRef(false);
  const save = useOptimisticRegionMutation(accountId, () => {
    saving.current = false;
  });
  function setRegion(next: RegionCode) {
    if (saving.current) {
      return;
    }
    if (signedIn) {
      saving.current = true;
      save.mutate({ region: next });
    } else {
      sessionRegion.setRegion(next);
    }
  }
  return { region, setRegion, saveFailed: save.isError, saving: save.isPending };
}

/** Signing out returns the session to the default region. */
export function resetSessionRegion(region: RegionCode) {
  sessionRegion.setRegion(region);
}
