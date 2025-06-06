'use client';

import { useSession } from '@/lib/auth-client';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

/**
 * Custom hook that shows a welcome toast notification when a user successfully logs in.
 *
 * Uses session state to detect when a user becomes authenticated and shows a toast
 * message only once per session to avoid duplicate notifications.
 */
export function useLoginToast() {
  const { data: session, isPending } = useSession();
  const hasShownToast = useRef(false);
  const previousSession = useRef(session);

  useEffect(() => {
    // Wait for session to load
    if (isPending) {
      return;
    }

    // Check if user just logged in (previous session was null/undefined and now we have a user)
    const wasLoggedOut = !previousSession.current?.user;
    const isNowLoggedIn = !!session?.user;
    const hasGreeted = window.sessionStorage.getItem('greeted') === 'true';

    if (
      wasLoggedOut &&
      isNowLoggedIn &&
      !hasShownToast.current &&
      !hasGreeted
    ) {
      toast.success(`Welcome back, ${session.user.name}!`, {
        description: 'You have successfully logged in.',
        duration: 4000,
      });
      hasShownToast.current = true;

      window.sessionStorage.setItem('greeted', 'true');
    }

    // Update previous session
    previousSession.current = session;
  }, [session, isPending]);

  // Reset the flag when user logs out
  useEffect(() => {
    if (!session?.user) {
      hasShownToast.current = false;
    }
  }, [session?.user]);
}
