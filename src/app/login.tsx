import { createFileRoute, redirect } from '@tanstack/react-router';
import { LogIn, Shield, Users, Zap } from 'lucide-react';

import { LoginForm } from '@/components/login-form';
import { getSession } from '@/lib/auth-server';
import { getSafeRedirectUrl } from '@/lib/utils';

export const Route = createFileRoute('/login')({
  validateSearch: (search: Record<string, unknown>) => ({
    error: search.error as string | undefined,
    redirect_url: search.redirect_url as string | undefined,
  }),
  beforeLoad: async ({ search }) => {
    const session = await getSession();
    if (session?.user) {
      const redirectTo = getSafeRedirectUrl(search.redirect_url);
      throw redirect({ to: redirectTo });
    }
    if (search.error === 'failed_to_login') {
      throw new Error('failed_to_login');
    }
  },
  component: LoginPage,
});

function LoginPage() {
  const { redirect_url } = Route.useSearch();

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <LogIn className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome Back</h1>
          <p className="mt-2 text-muted-foreground">
            Sign in to your account to continue exploring movies
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="flex items-center space-x-3 rounded-lg bg-muted/50 p-3">
            <Shield className="h-5 w-5 shrink-0 text-blue-500" />
            <div>
              <h3 className="text-sm font-medium">Secure Login</h3>
              <p className="text-xs text-muted-foreground">Fast and secure authentication</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 rounded-lg bg-muted/50 p-3">
            <Users className="h-5 w-5 shrink-0 text-green-500" />
            <div>
              <h3 className="text-sm font-medium">Personalized Experience</h3>
              <p className="text-xs text-muted-foreground">Get recommendations tailored to you</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 rounded-lg bg-muted/50 p-3">
            <Zap className="h-5 w-5 shrink-0 text-yellow-500" />
            <div>
              <h3 className="text-sm font-medium">Quick Access</h3>
              <p className="text-xs text-muted-foreground">Save favorites and create watchlists</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-muted-foreground/20" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-background px-4 text-muted-foreground">
                Choose your preferred method
              </span>
            </div>
          </div>

          <LoginForm redirectUrl={redirect_url} />

          <div className="text-center text-sm text-muted-foreground">
            <p>Choose between secure passkey authentication or social login</p>
          </div>
        </div>

        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            By signing in, you agree to our terms of service and privacy policy
          </p>
        </div>
      </div>
    </div>
  );
}
