'use client';

import { useEffect, useRef } from 'react';

export function useScrollOnPageChange(page: number) {
  const lastPage = useRef(page);

  useEffect(() => {
    const previous = lastPage.current;
    lastPage.current = page;

    if (page <= previous) {
      return;
    }

    const container = document.querySelector('#content-container');
    if (container) {
      container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [page]);
}

export function ScrollOnPageChange({ page }: { page: number }) {
  useScrollOnPageChange(page);
  return null;
}
