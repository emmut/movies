'use client';

import { useEffect, useRef } from 'react';

export function useScrollOnPageChange(page: number, resetKey?: unknown) {
  const lastPage = useRef(page);
  const lastResetKey = useRef(resetKey);

  useEffect(() => {
    const resetKeyChanged = lastResetKey.current !== resetKey;
    lastResetKey.current = resetKey;

    const pageChanged = lastPage.current !== page;
    lastPage.current = page;

    // Skip scroll when the reset key changed (e.g. selecting a genre resets the
    // page), only scroll on genuine page navigation.
    if (!pageChanged || resetKeyChanged) {
      return;
    }

    const container = document.querySelector('#content-container');
    if (container) {
      container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [page, resetKey]);
}

export function ScrollOnPageChange({ page, resetKey }: { page: number; resetKey?: unknown }) {
  useScrollOnPageChange(page, resetKey);
  return null;
}
