'use client';

import Link from 'next/link';
import type { ComponentProps } from 'react';

import { saveBackTarget } from '@/lib/back-target';

type BackTargetLinkProps = ComponentProps<typeof Link>;

/**
 * A `next/link` to a detail page (movie, tv, person) that records the current
 * URL as that page's "go back" target on click, so the detail page's back
 * button can return to the exact originating list — search query, discover
 * filters and all. See `@/lib/back-target`.
 */
export function BackTargetLink({ href, onClick, ...props }: BackTargetLinkProps) {
  return (
    <Link
      {...props}
      href={href}
      onClick={(event) => {
        saveBackTarget(typeof href === 'string' ? href : (href.pathname ?? ''));
        onClick?.(event);
      }}
    />
  );
}
