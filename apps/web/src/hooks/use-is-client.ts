import { useSyncExternalStore } from 'react';

function subscribe() {
  return function unsubscribe() {};
}

function getSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}

/**
 * Hook to determine if code is running on the client side.
 * Prevents hydration mismatches when accessing browser APIs like window.
 */
export function useIsClient() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
