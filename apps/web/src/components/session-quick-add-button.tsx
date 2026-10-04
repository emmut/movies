'use client';

import { useSession } from '@/lib/auth-client';

import { QuickAddButtonInner, type QuickAddButtonProps } from './quick-add-button-inner';

/**
 * Fallback for cards rendered from prerendered (cached) lists that have no
 * server-provided userId: resolve the signed-in user from the client session.
 * Only this path subscribes to the session, so server-id callers stay cheap.
 *
 * Loaded via next/dynamic with ssr: false (see quick-add-button.tsx): the
 * session only exists client-side, so skipping SSR and hydration for this
 * subtree makes a server/client HTML mismatch impossible.
 */
export default function SessionQuickAddButton(props: Omit<QuickAddButtonProps, 'userId'>) {
  const { data: session } = useSession();

  if (!session?.user?.id) {
    return null;
  }

  return <QuickAddButtonInner {...props} />;
}
