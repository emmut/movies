'use client';

import { OAuthLoginButton } from '@/components/ui/oauth-login-button';
import { signIn } from '@/lib/auth-client';

export function LoginForm() {
  return (
    <div className="flex flex-col justify-center gap-4">
      <OAuthLoginButton provider="discord" onClick={() => signIn()} size="lg" />
    </div>
  );
}
