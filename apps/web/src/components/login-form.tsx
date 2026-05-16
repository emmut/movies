
import { OAuthLoginButton } from '@movies/ui/components/oauth-login-button';
import { Separator } from '@movies/ui/components/separator';
import { signInAnonymous, signInDiscord, signInGitHub } from '@/lib/auth-client';

import { PasskeyLoginForm } from './passkey-login-form';

type LoginFormProps = {
  redirectUrl?: string;
};

export function LoginForm({ redirectUrl }: LoginFormProps) {
  return (
    <div className="flex flex-col justify-center gap-4">
      <OAuthLoginButton
        provider="discord"
        size="lg"
        redirectUrl={redirectUrl}
        signIn={(url) => signInDiscord(url ?? '/')}
      />
      <OAuthLoginButton
        provider="github"
        size="lg"
        redirectUrl={redirectUrl}
        signIn={(url) => signInGitHub(url ?? '/')}
      />

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator className="w-full" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or continue with passkey</span>
        </div>
      </div>

      <PasskeyLoginForm redirectUrl={redirectUrl} />

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator className="w-full" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or continue as</span>
        </div>
      </div>

      <OAuthLoginButton
        provider="anonymous"
        size="lg"
        redirectUrl={redirectUrl}
        signIn={() => signInAnonymous()}
      />
    </div>
  );
}
