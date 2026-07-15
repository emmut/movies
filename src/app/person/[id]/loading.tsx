import { ScrollToTop } from '@/components/scroll-to-top';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Displays a compact loading skeleton for the person detail page.
 *
 * Mirrors the above-the-fold layout of the person page (go-back control, profile
 * image, name, stats, and biography intro) while staying short enough to avoid
 * shifting the scroll position when the real content replaces it.
 */
export default function LoadingPerson() {
  return (
    <div>
      <ScrollToTop />
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

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-lg bg-zinc-900 p-4 text-center">
                <Skeleton className="mx-auto mb-2 h-6 w-6" />
                <Skeleton className="mx-auto mb-1 h-6 w-12" />
                <Skeleton className="mx-auto h-3 w-20" />
              </div>
            ))}
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
