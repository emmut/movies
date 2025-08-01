'use client';

import {
  signInAnonymous,
  signInDiscord,
  signInGitHub,
} from '@/lib/auth-client';
import { cn, getSafeRedirectUrl } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2, UserIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ReactNode, useState } from 'react';
import { toast } from 'sonner';
import { Button } from './button';

type AvailableOAuthProviders = 'discord' | 'google' | 'github' | 'anonymous';
type OAuthLoginButtonProps = VariantProps<typeof oauthButtonVariants> &
  React.ComponentProps<'button'> & {
    provider: AvailableOAuthProviders;
    text?: string;
    icon?: ReactNode;
    onClick?: () => void;
    redirectUrl?: string;
  };

const oauthButtonVariants = cva(
  'inline-flex items-center justify-center gap-3 rounded-md px-6 py-3 font-medium text-white transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      provider: {
        discord: 'bg-[#5865F2] hover:bg-[#4752C4] focus-visible:ring-[#5865F2]',
        google: 'bg-[#4285F4] hover:bg-[#3367D6] focus-visible:ring-[#4285F4]',
        github: 'bg-[#24292e] hover:bg-[#1b1f23] focus-visible:ring-[#24292e]',
        anonymous: 'bg-gray-500 hover:bg-gray-600 focus-visible:ring-gray-500',
      },
      size: {
        sm: 'h-9 px-3 text-sm',
        default: 'h-10 px-4 py-2',
        lg: 'h-12 px-6 py-3 text-base',
      },
    },
    defaultVariants: {
      provider: 'discord',
      size: 'lg',
    },
  }
);

const providerConfigs = {
  discord: {
    defaultText: 'Continue with Discord',
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="flex-shrink-0"
      >
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
      </svg>
    ),
  },
  google: {
    defaultText: 'Continue with Google',
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="flex-shrink-0"
      >
        <path
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          fill="#4285F4"
        />
        <path
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          fill="#34A853"
        />
        <path
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          fill="#FBBC05"
        />
        <path
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          fill="#EA4335"
        />
      </svg>
    ),
  },
  github: {
    defaultText: 'Continue with GitHub',
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="flex-shrink-0"
      >
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
      </svg>
    ),
  },
  anonymous: {
    defaultText: 'Continue as anonymous',
    icon: <UserIcon className="h-4 w-4" />,
  },
};

function initCurrentProvider(provider: AvailableOAuthProviders) {
  switch (provider) {
    case 'discord':
      return signInDiscord;
    case 'github':
      return signInGitHub;
    case 'anonymous':
    default:
      return signInAnonymous;
  }
}

/**
 * Displays an OAuth login button with provider-specific styling, icon, and text, supporting loading and error states.
 *
 * The button adapts its appearance and content based on the selected OAuth provider. When clicked, it initiates the provider's sign-in flow and redirects to a sanitized URL upon success. Custom text and icon can be provided; otherwise, provider defaults are used. Shows a loading indicator while authenticating and disables interaction if the `disabled` prop is set.
 *
 * @param provider - The OAuth provider to use for authentication ('discord', 'google', 'github', or 'anonymous').
 * @param text - Optional custom button text to display instead of the provider default.
 * @param icon - Optional custom icon to display instead of the provider default.
 * @param size - Button size variant.
 * @param className - Additional CSS classes for the button.
 * @param redirectUrl - Optional URL to redirect to after successful authentication; sanitized before use.
 */
export function OAuthLoginButton({
  provider = 'discord',
  text,
  icon,
  disabled = false,
  size = 'lg',
  className,
  redirectUrl,
  ...props
}: OAuthLoginButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const config = providerConfigs[provider];
  const displayText = text || config.defaultText;
  const displayIcon = icon !== undefined ? icon : config.icon;
  const router = useRouter();
  const safeRedirectUrl = getSafeRedirectUrl(redirectUrl);

  /**
   * Initiates the OAuth sign-in process for the selected provider and handles post-authentication navigation.
   *
   * Sets the loading state, calls the appropriate provider's sign-in function with a sanitized redirect URL, displays an error toast on failure, and navigates to the redirect URL on success.
   */
  async function handleLogin() {
    setIsLoading(true);
    try {
      const currentProvider = initCurrentProvider(provider);
      const { error } = await currentProvider(safeRedirectUrl);
      if (error) {
        const providerName =
          provider === 'anonymous'
            ? 'anonymously'
            : `with ${provider.charAt(0).toUpperCase() + provider.slice(1)}`;
        toast.error(`Failed to sign in ${providerName}`);
        console.error(error);
      } else {
        router.push(safeRedirectUrl);
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to sign in:', error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button
      className={cn(oauthButtonVariants({ provider, size }), className)}
      disabled={disabled}
      type="button"
      onClick={handleLogin}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          {displayIcon}
          {displayText}
        </>
      )}
    </Button>
  );
}
