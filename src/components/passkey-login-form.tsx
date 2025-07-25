'use client';

import { Button } from '@/components/ui/button';
import { signInPasskey } from '@/lib/auth-client';
import { getSafeRedirectUrl } from '@/lib/utils';
import { PasskeyFillIcon } from '@primer/octicons-react';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

export function PasskeyLoginForm({ redirectUrl }: { redirectUrl?: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const hiddenInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handlePasskeyLogin() {
    const currentEmail = hiddenInputRef.current?.value ?? null;

    if (currentEmail === null) {
      toast.error('Please enter your email address');
      return;
    }

    setIsLoading(true);

    const data = await signInPasskey(currentEmail);

    if (data?.error) {
      toast.error('Failed to sign in with passkey. Please try again.');
      setIsLoading(false);
    } else {
      const safeRedirectUrl = getSafeRedirectUrl(redirectUrl);
      router.push(safeRedirectUrl);
      router.refresh();
    }
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    await handlePasskeyLogin();
  }

  return (
    <>
      <div className="space-y-3">
        <form onSubmit={handleEmailSubmit}>
          <input
            ref={hiddenInputRef}
            type="hidden"
            autoComplete="username webauthn"
          />

          <Button
            onClick={handlePasskeyLogin}
            className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-md bg-gray-500 px-6 py-3 text-base font-medium text-white transition-all duration-200 hover:bg-gray-600 focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
            disabled={isLoading}
            size="lg"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Authenticating...
              </div>
            ) : (
              <>
                <PasskeyFillIcon size={16} className="h-4 w-4" />
                Authenticate with Passkey
              </>
            )}
          </Button>
        </form>
      </div>
    </>
  );
}
