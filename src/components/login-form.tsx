'use client';

import { OAuthLoginButton } from '@/components/ui/oauth-login-button';
import {
  signInAnonymous,
  signInDiscord,
  signInGitHub,
} from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

/**
 * Renders a login form with Discord OAuth and anonymous login options.
 *
 * Provides two large buttons for users to sign in via Discord OAuth or anonymously. Displays an error notification if anonymous sign-in fails and navigates to the home page on success.
 */
export function LoginForm() {
  const router = useRouter();

  return (
    <div className="flex flex-col justify-center gap-4">
      <OAuthLoginButton
        provider="discord"
        onClick={() => signInDiscord()}
        size="lg"
      />
      <OAuthLoginButton
        provider="github"
        onClick={() => signInGitHub()}
        size="lg"
      />
      <OAuthLoginButton
        provider="anonymous"
        onClick={async () => {
          const { error } = await signInAnonymous();
          if (error) {
            toast.error('Failed to sign in anonymously');
            console.error(error);
          } else {
            router.push('/');
            router.refresh();
          }
        }}
        size="lg"
      />
    </div>
  );
}
