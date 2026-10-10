import { DEFAULT_REGION } from '@movies/config/regions';
import { queryClient } from '@native/lib/api';
import { authClient } from '@native/lib/auth-client';
import { useRegion } from '@native/lib/preferences';
import { useEffect, useRef, type ReactNode } from 'react';

/** Session-specific cache entries cannot survive an account change or sign-out. */
export function SessionBoundary({ children }: { children: ReactNode }) {
  const { data } = authClient.useSession();
  const userId = data?.user.id ?? null;
  const previousUser = useRef<string | null | undefined>(undefined);
  const { setRegion } = useRegion();
  useEffect(() => {
    if (previousUser.current !== undefined && previousUser.current !== userId) {
      queryClient.clear();
      if (userId === null) {
        setRegion(DEFAULT_REGION);
      }
    }
    previousUser.current = userId;
  }, [userId, setRegion]);
  return children;
}
