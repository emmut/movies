'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { subscribeToPreferenceRefresh } from '@/lib/preference-refresh';
import { invalidateAccountQueriesOnReturn } from '@/lib/query-invalidation';

/** Private Next caches live in the browser: refresh both rendered props and client queries. */
export function PreferenceRefresh() {
  const router = useRouter();
  const queryClient = useQueryClient();
  useEffect(
    () =>
      subscribeToPreferenceRefresh(() => {
        router.refresh();
        void invalidateAccountQueriesOnReturn(queryClient);
      }),
    [router, queryClient],
  );
  return null;
}
