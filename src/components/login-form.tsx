'use client';

import { OAuthLoginButton } from '@/components/ui/oauth-login-button';
import { Separator } from '@/components/ui/separator';
import { PasskeyLoginForm } from './passkey-login-form';

type LoginFormProps = {
  redirectUrl?: string;
};

/**
 * Displays a login form offering authentication via OAuth providers, passkey, or anonymous login.
 *
 * Arranges multiple login options vertically, passing an optional redirect URL to each authentication method.
 *
 * @param redirectUrl - Optional URL to redirect to after successful authentication
 */
export function LoginForm({ redirectUrl }: LoginFormProps) {
  return (
    <div className="flex flex-col justify-center gap-4">
      <OAuthLoginButton
        provider="discord"
        size="lg"
        redirectUrl={redirectUrl}
      />
      <OAuthLoginButton provider="github" size="lg" redirectUrl={redirectUrl} />

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

      <PasskeyLoginForm redirectUrl={redirectUrl} />

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

      <OAuthLoginButton
        provider="anonymous"
        size="lg"
        redirectUrl={redirectUrl}
      />
    </div>
  );
}
