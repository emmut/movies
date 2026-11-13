import { useSyncExternalStore } from 'react';

const QUERY = '(any-pointer: fine)';

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener('change', onChange);
  return () => mql.removeEventListener('change', onChange);
}

/** Includes mice attached to devices whose primary input is touch. */
export function useHasPointer() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => true,
  );
}
