'use client';

import { OAuthLoginButton } from '@/components/ui/oauth-login-button';
import { signIn, signInAnonymous } from '@/lib/auth-client';

/**
 * Renders a login form with a Discord OAuth login button.
 *
 * Displays a vertically arranged container containing a large Discord login button that initiates the OAuth sign-in process when clicked.
 */
export function LoginForm() {
  return (
    <div className="flex flex-col justify-center gap-4">
      <OAuthLoginButton provider="discord" onClick={() => signIn()} size="lg" />
      <OAuthLoginButton
        provider="anonymous"
        onClick={() => signInAnonymous()}
        size="lg"
      />
    </div>
  );
}
