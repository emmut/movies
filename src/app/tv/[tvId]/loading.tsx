import { Skeleton } from '@/components/ui/skeleton';

export default function LoadingTvShows() {
  return (
    <>
      <div className="mb-6">
        <Skeleton className="h-10 w-24" />
      </div>

      <div className="relative -mx-4 mb-8 h-64 md:h-80 lg:h-96">
        <Skeleton className="h-full w-full" />
        <div className="absolute inset-0 bg-linear-to-t from-black via-black/60 to-transparent" />
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Skeleton className="mx-auto aspect-2/3 w-full rounded-lg shadow-2xl sm:mx-0 lg:max-w-full" />
        </div>

        <div className="space-y-4 lg:col-span-8">
          <div className="space-y-2">
            <Skeleton className="h-12 w-64" />
            <Skeleton className="h-6 w-32" />
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

          <div>
            <div className="flex flex-wrap gap-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-8 w-20 rounded-full bg-zinc-800" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
