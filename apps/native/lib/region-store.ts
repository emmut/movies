import { DEFAULT_REGION, getRegionByCode, type RegionCode } from '@movies/config/regions';

/** Region belongs to the app session, including router layout remounts. */
export function createRegionStore(initialRegion: RegionCode = DEFAULT_REGION) {
  let region = initialRegion;
  const listeners = new Set<() => void>();
  return {
    getSnapshot() {
      return region;
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return function unsubscribe() {
        listeners.delete(listener);
      };
    },
    setRegion(nextRegion: string) {
      const selected = getRegionByCode(nextRegion);
      if (!selected) {
        throw new Error('Invalid region code');
      }
      if (selected.code === region) {
        return;
      }
      region = selected.code;
      for (const listener of listeners) {
        listener();
      }
    },
  };
}

/**
 * A signed-in account owns its region, as on web; the session store covers
 * signed-out use and the moment before the account preference has loaded.
 */
export function resolveRegion(sessionRegion: RegionCode, accountRegion: RegionCode | undefined) {
  if (accountRegion) {
    return accountRegion;
  }
  return sessionRegion;
}
