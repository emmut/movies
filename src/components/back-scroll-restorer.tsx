'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

import { restoreBackScrollIfScheduled } from '@/lib/back-scroll';

/**
 * Consumes a pending back-navigation scroll restore (see `@/lib/back-scroll`)
 * once the destination renders. Mounted once in the root layout; keyed on
 * pathname because the back button always navigates across pathnames.
 */
export function BackScrollRestorer() {
  const pathname = usePathname();

  useEffect(restoreBackScrollIfScheduled, [pathname]);

  return null;
}
