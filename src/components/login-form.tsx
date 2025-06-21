'use client';

import { OAuthLoginButton } from '@/components/ui/oauth-login-button';
import { signIn, signInAnonymous } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

/**
 * Renders a login form with a Discord OAuth login button.
 *
 * Displays a vertically arranged container containing a large Discord login button that initiates the OAuth sign-in process when clicked.
 */
export function LoginForm() {
  const router = useRouter();

  return (
    <div className="flex flex-col justify-center gap-4">
      <OAuthLoginButton provider="discord" onClick={() => signIn()} size="lg" />
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
