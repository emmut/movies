import { Skeleton } from '@/components/ui/skeleton';

/**
 * Displays a compact loading skeleton for the person detail page.
 *
 * Mirrors the above-the-fold layout of the person page (go-back control, profile
 * image, name, stats, and biography intro).
 */
export default function LoadingPerson() {
  return (
    // Rendered full-height, no clipping: landing at the top after a scrolled
    // client-side navigation is the scroll handler's job (see next.config.ts),
    // guarded by e2e/detail-scroll.spec.ts.
    <div>
      <div className="mb-6">
        <Skeleton className="h-10 w-24" />
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Skeleton className="aspect-2/3 w-full max-w-64 rounded-lg shadow-2xl lg:max-w-full" />
        </div>

        <div className="space-y-4 lg:col-span-8">
          <div className="flex flex-col items-start gap-3">
            <Skeleton className="h-12 w-64" />
            <Skeleton className="h-7 w-16 rounded-full" />
          </div>

          <div className="@container">
            <div className="grid grid-cols-2 gap-4 @3xl:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="rounded-lg bg-zinc-900 p-5">
                  <Skeleton className="mb-3 h-5 w-5" />
                  <Skeleton className="mb-1 h-6 w-12" />
                  <Skeleton className="h-3 w-20" />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </div>
    </div>
  );
}
