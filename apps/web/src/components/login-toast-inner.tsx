'use client';

import { useLoginToast } from '@/hooks/use-login-toast';

/** Split from LoginToastHandler so next/dynamic can code-split the auth client. */
export default function LoginToastInner() {
  useLoginToast();
  return null;
}
