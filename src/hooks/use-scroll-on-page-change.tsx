'use client';

import { useEffect, useRef } from 'react';

export function useScrollOnPageChange(page: number) {
  const lastPage = useRef(page);

  useEffect(() => {
    if (lastPage.current === page) {
      return;
    }
    lastPage.current = page;

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
