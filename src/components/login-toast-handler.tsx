'use client';

import dynamic from 'next/dynamic';

// Loaded in its own chunk after hydration: the toast pulls in the whole
// better-auth client, which must not sit in every route's first-load JS.
const LoginToastInner = dynamic(() => import('./login-toast-inner'), { ssr: false });

/**
 * Client component that handles login toast notifications.
 *
 * This component uses the useLoginToast hook to show welcome messages
 * when users successfully log in. It renders nothing visible but provides
 * the side effect of showing toasts.
 */
export function LoginToastHandler() {
  return <LoginToastInner />;
}
