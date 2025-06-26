import { Skeleton } from '@/components/ui/skeleton';
import SliderSkeleton from './slider-skeleton';

/**
 * Loading state component for the actor page.
 * Displays skeleton placeholders while actor data is being fetched.
 */
export default function ActorLoading() {
  return (
    <div className="min-h-screen">
      <div className="mb-6">
        <Skeleton className="h-10 w-48" />
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Skeleton className="mx-auto aspect-2/3 w-full max-w-md rounded-lg" />
        </div>

        <div className="space-y-6 lg:col-span-8">
          <div className="flex flex-col items-start gap-3">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-6 w-20" />
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-lg bg-zinc-900 p-4">
                <Skeleton className="mx-auto mb-2 h-6 w-6" />
                <Skeleton className="mx-auto mb-1 h-8 w-12" />
                <Skeleton className="mx-auto h-4 w-16" />
              </div>
            ))}
          </div>

          <div>
            <Skeleton className="mb-3 h-6 w-24" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i}>
                  <Skeleton className="mb-1 h-4 w-20" />
                  <Skeleton className="h-5 w-32" />
                </div>
              ))}
            </div>
            <div className="space-y-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i}>
                  <Skeleton className="mb-1 h-4 w-20" />
                  <Skeleton className="h-5 w-28" />
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
            <Skeleton className="h-10 w-16" />
            <Skeleton className="h-10 w-20" />
          </div>
        </div>
      </div>
    </div>
  );
}
