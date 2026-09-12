'use client';

import { toast } from 'sonner';

import { useSession } from '@/lib/auth-client';

const GREET_KEY = 'pendingGreet';

function hasPendingGreet(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  try {
    return window.sessionStorage.getItem(GREET_KEY) === '1';
  } catch {
    return false;
  }
}

function clearPendingGreet() {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.sessionStorage.removeItem(GREET_KEY);
  } catch {
    // ignore
  }
}

/**
 * Client-side better-auth hook without useEffect: reads `useSession` (nanostore
 * atom, works with cookieCache) synchronously during render and toasts once
 * when `pendingGreet` set via `onRequest` in `src/lib/auth-client.ts` after
 * OAuth redirect. Passkey toasts via `onSuccess` directly.
 */
// fallow-ignore-next-line complexity -- sequential guards clearer than abstraction
export function useLoginToast() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return;
  }
  if (!session?.user) {
    return;
  }
  if (!hasPendingGreet()) {
    return;
  }
  clearPendingGreet();
  if (session.user.isAnonymous) {
    queueMicrotask(() =>
      toast.success('Welcome!', {
        description: 'You are signed in anonymously.',
        duration: 4000,
      }),
    );
    return;
  }
  queueMicrotask(() =>
    toast.success(`Welcome back, ${session.user.name}!`, {
      description: 'You have successfully logged in.',
      duration: 4000,
    }),
  );
}
