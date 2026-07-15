'use client';

import { useEffect } from 'react';

/**
 * Resets the window scroll to the top on mount. Rendered inside a route's
 * `loading.tsx` so a tall skeleton doesn't appear scrolled down: on a
 * client-side navigation the loading fallback mounts at the previous route's
 * scroll offset and Next only resets scroll once the real content arrives, so a
 * skeleton taller than the viewport is briefly shown "chopped off". Resetting on
 * mount brings it to the top immediately.
 */
export function ScrollToTop() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return null;
}
