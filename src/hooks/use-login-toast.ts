'use client';

import { toast } from 'sonner';

import { useSession } from '@/lib/auth-client';
import { clearPendingGreet, hasPendingGreet } from '@/lib/pending-greet';

/**
 * Client-side better-auth hook without useEffect: reads `useSession` (nanostore
 * atom) synchronously during render and toasts once when `pendingGreet` was set
 * via `onRequest` in `src/lib/auth-client.ts` before an OAuth/passkey/anonymous
 * sign-in completed.
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
  const { isAnonymous, name } = session.user;
  const title = isAnonymous ? 'Welcome!' : `Welcome back, ${name}!`;
  const description = isAnonymous
    ? 'You are signed in anonymously.'
    : 'You have successfully logged in.';

  queueMicrotask(() => toast.success(title, { description, duration: 4000 }));
}
