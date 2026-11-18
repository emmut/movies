'use client';

import { useEffect, useLayoutEffect } from 'react';

import {
  cancelScrollToContent,
  markPaginationContentReady,
  scrollToContentIfScheduled,
} from '@/lib/scroll-to-content';

export function usePaginationScroll(page: number, shallow: boolean) {
  // Server navigation can remount the controls after a loading state. Consume
  // its schedule once the destination commits. Shallow navigation instead
  // consumes its schedule in the click handler after the URL flush.
  useEffect(() => {
    if (!shallow) {
      scrollToContentIfScheduled();
    }
  }, [page, shallow]);
}

type PaginationContentState = {
  data: unknown;
  isPending: boolean;
  isError: boolean;
};

export function usePaginationContentReady(
  page: number,
  { data, isPending, isError }: PaginationContentState,
) {
  useLayoutEffect(() => cancelScrollToContent, []);

  // Results and errors must commit before releasing the protected page height.
  // Fetch completion alone is too early and can interrupt scrolling in Safari.
  useLayoutEffect(() => {
    if (!isPending) {
      markPaginationContentReady(page);
    }
  }, [data, isPending, isError, page]);
}
