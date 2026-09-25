import { cn } from 'cn';
import { LogIn, Shield, Users, Zap } from 'lucide-react';
import { redirect } from 'next/navigation';

import { LOGIN_COPY, LOGIN_FEATURES } from '@/components/login-copy';
import { LoginForm } from '@/components/login-form';
import { getSession } from '@/lib/auth-server';
import { getSafeRedirectUrl } from '@/lib/utils';

const LOGIN_FEATURE_ICONS = {
  secure: Shield,
  personalized: Users,
  quick: Zap,
} as const;

const LOGIN_FEATURE_ICON_CLASS_NAMES = {
  secure: 'text-blue-500',
  personalized: 'text-green-500',
  quick: 'text-yellow-500',
} as const;

/**
 * Renders the login page for unauthenticated users or redirects authenticated users to a validated destination.
 *
 * If a login error is detected in the search parameters, throws an error. Authenticated users are redirected to a safe URL specified by `redirect_url` or to the home page. Unauthenticated users are presented with the login interface, feature highlights, and authentication options.
 */
export default async function LoginPage(props: {
  searchParams: Promise<{
    error?: string;
    redirect_url?: string;
  }>;
}) {
  const { error, redirect_url } = await props.searchParams;

  if (error === 'failed_to_login') {
    throw new Error(error);
  }

  const session = await getSession();

  if (session?.user) {
    // Only redirect if URL is valid, otherwise go to home
    const redirectTo = getSafeRedirectUrl(redirect_url);
    redirect(redirectTo);
  }

  // Pass redirect URL to LoginForm (validation happens on successful login)
  const redirectUrl = redirect_url;

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="flex w-full max-w-md flex-col gap-8">
        <div className="text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10">
            <LogIn className="size-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome Back</h1>
          <p className="mt-2 text-muted-foreground">{LOGIN_COPY.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {LOGIN_FEATURES.map((feature) => {
            const Icon = LOGIN_FEATURE_ICONS[feature.id];

            return (
              <div key={feature.id} className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                <Icon
                  className={cn('size-5 shrink-0', LOGIN_FEATURE_ICON_CLASS_NAMES[feature.id])}
                />
                <div>
                  <h3 className="text-sm font-medium">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col gap-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-muted-foreground/20" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-background px-4 text-muted-foreground">
                {LOGIN_COPY.methodPrompt}
              </span>
            </div>
          </div>

          <LoginForm redirectUrl={redirectUrl} />

          <div className="text-center text-sm text-muted-foreground">
            <p>{LOGIN_COPY.authHint}</p>
          </div>
        </div>

        <div className="text-center">
          <p className="text-xs text-muted-foreground">{LOGIN_COPY.terms}</p>
        </div>
      </div>
    </div>
  );
}
