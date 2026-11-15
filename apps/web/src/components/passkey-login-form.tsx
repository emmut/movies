'use client';

import { Button } from '@movies/ui/components/button';
import { PasskeyFillIcon } from '@primer/octicons-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { signInPasskey } from '@/lib/auth-client';
import { showPasskeyFailure } from '@/lib/passkey-feedback';
import { getSafeRedirectUrl } from '@/lib/utils';

/**
 * Renders a button that signs the user in with a discoverable passkey.
 *
 * No username is asked for: the browser offers the passkeys it holds for this
 * site. On success, redirects to a safe URL derived from `redirectUrl`. A
 * dismissed OS prompt is silent; other failures show a toast.
 *
 * @param redirectUrl - Optional URL to redirect to after successful authentication
 */
export function PasskeyLoginForm({ redirectUrl }: { redirectUrl?: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handlePasskeyLogin() {
    setIsLoading(true);

    const result = await signInPasskey();

    if (!result.ok) {
      showPasskeyFailure(result.reason, 'Failed to sign in with passkey. Please try again.');
      setIsLoading(false);
      return;
    }

    router.push(getSafeRedirectUrl(redirectUrl));
    router.refresh();
  }

  return (
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
  );
}
