import { useSyncExternalStore } from 'react';

const QUERY = '(hover: hover)';

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener('change', onChange);
  return () => mql.removeEventListener('change', onChange);
}

/**
 * Whether the primary input device can hover — a mouse or trackpad rather than
 * a touchscreen. Used to decide whether hover-only affordances are worth
 * rendering at all.
 *
 * `useSyncExternalStore` for the same reason as {@link useIsMobile}: hydration
 * renders see the server value, and the subscription means a device that gains
 * a pointer (a tablet with a keyboard case attached) updates instead of keeping
 * whatever was true at mount.
 */
export function useHasHover() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => true,
  );
}
