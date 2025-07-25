'use client';

import { OAuthLoginButton } from '@/components/ui/oauth-login-button';
import { Separator } from '@/components/ui/separator';
import { PasskeyLoginForm } from './passkey-login-form';

/**
 * Renders a login form with multiple authentication options including passkeys, OAuth, and anonymous login.
 *
 * Provides passkey authentication alongside social login options. Displays an error notification if anonymous sign-in fails and navigates to the home page on success.
 */
export function LoginForm() {
  return (
    <div className="flex flex-col justify-center gap-4">
      <OAuthLoginButton provider="discord" size="lg" />
      <OAuthLoginButton provider="github" size="lg" />

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator className="w-full" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background text-muted-foreground px-2">
            Or continue with passkey
          </span>
        </div>
      </div>

      <PasskeyLoginForm />

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator className="w-full" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background text-muted-foreground px-2">
            Or continue as
          </span>
        </div>
      </div>

      <OAuthLoginButton provider="anonymous" size="lg" />
    </div>
  );
}
