'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      history.scrollRestoration = 'manual';
    }
  }, []);

  return null;
}
