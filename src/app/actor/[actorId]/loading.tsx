import { Skeleton } from '@/components/ui/skeleton';
import SliderSkeleton from './slider-skeleton';

/**
 * Displays a full-page loading skeleton UI for an actor detail page.
 *
 * Renders animated placeholder elements that mimic the layout of an actor detail view,
 * including profile image, name, stats, biography, filmography sliders, and external links.
 */
export default function Loading() {
  return (
    <div className="min-h-screen">
      <div className="mb-6">
        <Skeleton className="h-10 w-24" />
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Skeleton className="mx-auto aspect-2/3 w-full max-w-xs rounded-lg shadow-2xl sm:mx-0" />
        </div>

        <div className="space-y-6 lg:col-span-8">
          <div className="flex flex-col items-start gap-3">
            <Skeleton className="h-12 w-64" />
            <Skeleton className="h-7 w-16 rounded-full" />
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-lg bg-zinc-900 p-4 text-center">
                <Skeleton className="mx-auto mb-2 h-6 w-6" />
                <Skeleton className="mx-auto mb-1 h-8 w-12" />
                <Skeleton className="mx-auto h-4 w-16" />
                <Skeleton className="mx-auto mt-1 h-3 w-20" />
              </div>
            ))}
          </div>

          <div>
            <Skeleton className="mb-3 h-6 w-24" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i}>
                  <Skeleton className="mb-1 h-3 w-20" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </div>
            <div className="space-y-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i}>
                  <Skeleton className="mb-1 h-3 w-24" />
                  <Skeleton className="h-4 w-28" />
                </div>
              ))}
            </div>
          </div>

          <div>
            <Skeleton className="mb-4 h-6 w-32" />
            <SliderSkeleton />
          </div>

          <div>
            <Skeleton className="mb-4 h-6 w-36" />
            <SliderSkeleton />
          </div>

          <div className="flex flex-wrap gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-20 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
