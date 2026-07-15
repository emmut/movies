import { Skeleton } from '@/components/ui/skeleton';

/**
 * Loading skeleton for the login page.
 *
 * Mirrors the centered auth column (icon, heading, feature highlights, and the
 * sign-in actions) so the layout matches the real page while the session check
 * resolves.
 */
export default function LoginLoading() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center">
          <Skeleton className="mb-4 h-12 w-12 rounded-full" />
          <Skeleton className="h-9 w-48" />
          <Skeleton className="mt-2 h-5 w-72 max-w-full" />
        </div>

        <div className="grid grid-cols-1 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-3 rounded-lg bg-muted/50 p-3">
              <Skeleton className="h-5 w-5 shrink-0 rounded" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-56 max-w-full" />
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <Skeleton className="h-4 w-56 mx-auto" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </div>
  );
}
