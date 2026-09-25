import { cn } from 'cn';

import { LOGIN_COPY, LOGIN_FEATURES } from '@/components/login-copy';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Loading skeleton for the login page.
 *
 * Uses the loaded page's copy as invisible sizing content so line wrapping and
 * section heights stay identical at every viewport width.
 */
export default function LoginLoading() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <span className="sr-only">Loading sign in</span>
      <div aria-hidden="true" className="flex w-full max-w-md flex-col gap-8">
        <div className="flex flex-col items-center text-center">
          <Skeleton className="mb-4 size-12 rounded-full" />
          <Skeleton className="h-9 w-48" />
          <CopySkeleton
            copy={LOGIN_COPY.subtitle}
            slot="login-subtitle-skeleton"
            textClassName="mt-2"
            skeletonClassName="h-6 w-72 max-w-full"
          />
        </div>

        <div className="grid grid-cols-1 gap-4">
          {LOGIN_FEATURES.map((feature) => (
            <div
              key={feature.id}
              data-slot="login-feature-skeleton"
              className="flex items-center gap-3 rounded-lg bg-muted/50 p-3"
            >
              <Skeleton className="size-5 shrink-0 rounded" />
              <div className="relative flex-1">
                <div className="invisible">
                  <p className="text-sm font-medium">{feature.title}</p>
                  <p className="text-xs">{feature.description}</p>
                </div>
                <div className="absolute inset-0 flex flex-col">
                  <Skeleton className="h-5 w-40 max-w-full" />
                  <Skeleton className="h-4 w-56 max-w-full" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          <CopySkeleton
            copy={LOGIN_COPY.methodPrompt}
            textClassName="text-sm"
            skeletonClassName="h-5 w-56 max-w-full"
          />

          <div className="flex flex-col justify-center gap-4">
            <LoginActionSkeleton />
            <LoginActionSkeleton />
            <LoginSeparatorSkeleton />
            <LoginActionSkeleton />
            <LoginSeparatorSkeleton />
            <LoginActionSkeleton />
          </div>

          <CopySkeleton
            copy={LOGIN_COPY.authHint}
            slot="login-auth-hint-skeleton"
            textClassName="text-sm"
            skeletonClassName="h-5 w-80 max-w-full"
          />
        </div>

        <CopySkeleton
          copy={LOGIN_COPY.terms}
          slot="login-terms-skeleton"
          textClassName="text-xs"
          skeletonClassName="h-4 w-96 max-w-full"
        />
      </div>
    </div>
  );
}

function LoginActionSkeleton() {
  return <Skeleton data-slot="login-action-skeleton" className="h-12 w-full" />;
}

function LoginSeparatorSkeleton() {
  return <Skeleton data-slot="login-separator-skeleton" className="mx-auto h-4 w-48" />;
}

function CopySkeleton({
  copy,
  skeletonClassName,
  textClassName,
  slot,
}: {
  copy: string;
  skeletonClassName: string;
  textClassName: string;
  slot?: string;
}) {
  return (
    <div data-slot={slot} className={cn('relative w-full text-center', textClassName)}>
      <span className="invisible">{copy}</span>
      <Skeleton className={cn('absolute top-0 left-1/2 -translate-x-1/2', skeletonClassName)} />
    </div>
  );
}
