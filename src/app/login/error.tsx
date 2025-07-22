'use client';

import { Button } from '@/components/ui/button';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

/**
 * Displays a contextual login error message and troubleshooting steps based on the URL error parameter.
 *
 * Renders a user-friendly error page with a relevant title, description, and suggested actions depending on the type of login error encountered. Provides options to retry login or return to the home page.
 */
function LoginError() {
  const searchParams = useSearchParams();
  const errorType = searchParams.get('error');

  function getErrorMessage() {
    switch (errorType) {
      case 'failed_to_login':
        return {
          title: 'Login Failed',
          description:
            'We could not log you in with Discord. This might be because you cancelled the login or a technical problem occurred.',
        };
      case 'access_denied':
        return {
          title: 'Access Denied',
          description:
            'You denied the application access to your Discord account. To use this service, we need your permission.',
        };
      case 'server_error':
        return {
          title: 'Server Error',
          description:
            'An unexpected error occurred on our servers. Please try again in a moment.',
        };
      default:
        return {
          title: 'Login Error',
          description:
            'An unexpected error occurred during the login process. Please try again or contact support if the problem persists.',
        };
    }
  }

  const error = getErrorMessage();

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
            <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{error.title}</h1>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            {error.description}
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4">
            <h3 className="mb-2 text-sm font-medium">What you can do</h3>
            <ul className="text-muted-foreground list-inside list-disc space-y-1 text-xs">
              <li>Try logging in again</li>
              <li>Check that you allow the application access</li>
              <li>Make sure you have a stable internet connection</li>
              {errorType === 'failed_to_login' && (
                <li>Try logging in anonymously instead</li>
              )}
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <Button asChild className="w-full">
              <Link href="/login">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Link>
            </Button>

            <Button variant="outline" asChild className="w-full">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </Button>
          </div>
        </div>

        <div className="text-center">
          <p className="text-muted-foreground text-xs">
            If the problem persists, please contact support for help.
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginError;
