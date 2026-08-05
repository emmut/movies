import { useSyncExternalStore } from 'react';

import { readSessionStorageValue, subscribeToSessionStorage } from '@/lib/session-storage';

/**
 * Reads a `sessionStorage` value as reactive state via `useSyncExternalStore`.
 *
 * Re-renders when the value changes — through `writeSessionStorageValue`
 * in this document or the native `storage` event from another one. Returns
 * `null` on the server, when the key is absent, and when storage is
 * unavailable, so server and client HTML stay consistent through hydration.
 */
export function useSessionStorageValue(key: string) {
  return useSyncExternalStore(
    subscribeToSessionStorage,
    () => readSessionStorageValue(key),
    () => null,
  );
}
