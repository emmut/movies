'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { OAuthLoginButton } from '@/components/ui/oauth-login-button';
import { signInGitHubSettings, signInSettings } from '@/lib/auth-client';
import { useEffect } from 'react';
import { toast } from 'sonner';

type LinkAccountProps = {
  error?: string;
};

/**
 * React component that renders a UI for linking a user account to Discord or GitHub.
 *
 * Displays an error notification if the linking attempt fails.
 *
 * @param error - Optional error code indicating a failed account linking attempt
 */
function LinkAccount({ error }: LinkAccountProps) {
  useEffect(() => {
    if (error === 'failed-to-link-account') {
      toast.error('Failed to link your account');
    }
  }, [error]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Link your account</CardTitle>
        <CardDescription>
          Link your account to your preferred social account to get access to
          more features.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          <OAuthLoginButton
            provider="discord"
            text="Link using Discord"
            onClick={() => {
              signInSettings('/');
            }}
            className="w-full max-w-sm"
          />
          <OAuthLoginButton
            provider="github"
            text="Link using GitHub"
            onClick={() => {
              signInGitHubSettings('/');
            }}
            className="w-full max-w-sm"
          />
        </div>
      </CardContent>
    </Card>
  );
}

LinkAccount.displayName = 'LinkAccount';
export { LinkAccount };
