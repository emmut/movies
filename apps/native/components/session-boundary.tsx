import { DEFAULT_REGION } from '@movies/config/regions';
import { queryClient } from '@native/lib/api';
import { authClient } from '@native/lib/auth-client';
import { resetSessionRegion } from '@native/lib/preferences';
import { classifySessionChange } from '@native/lib/session-change';
import { useEffect, useRef, type ReactNode } from 'react';

/**
 * Session-specific cache entries cannot survive an account change or sign-out.
 * The first settled session is the baseline, not a change: resetting then
 * would drop the queries the opening screen is already showing.
 */
export function SessionBoundary({ children }: { children: ReactNode }) {
  const { data, isPending } = authClient.useSession();
  const userId = data?.user.id ?? null;
  const previousUser = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    if (isPending) {
      return;
    }
    const change = classifySessionChange(previousUser.current, userId);
    previousUser.current = userId;
    if (change === 'none') {
      return;
    }
    // Reset clears every user's cached data and refetches what is on screen.
    void queryClient.resetQueries();
    if (change === 'signed-out') {
      resetSessionRegion(DEFAULT_REGION);
    }
  }, [userId, isPending]);
  return children;
}
