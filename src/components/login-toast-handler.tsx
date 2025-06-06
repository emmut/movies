'use client';

import { useLoginToast } from '@/hooks/use-login-toast';

/**
 * Client component that handles login toast notifications.
 *
 * This component uses the useLoginToast hook to show welcome messages
 * when users successfully log in. It renders nothing visible but provides
 * the side effect of showing toasts.
 */
export function LoginToastHandler() {
  useLoginToast();
  return null;
}
