import { Skeleton } from '@/components/ui/skeleton';

export default function LoadingMovies() {
  return (
    <div className="min-h-screen">
      <div className="mb-6">
        <Skeleton className="h-10 w-24" />
      </div>

      <div className="relative -mx-4 mb-8 h-64 md:h-80 lg:h-96">
        <Skeleton className="h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Skeleton className="mx-auto aspect-2/3 w-full max-w-xs rounded-lg shadow-2xl sm:mx-0" />
        </div>

        <div className="space-y-6 lg:col-span-8">
          <div className="@container/title">
            <div className="flex flex-col justify-between gap-4 @2xl/title:flex-row">
              <div className="flex flex-col gap-x-4 gap-y-2">
                <Skeleton className="h-12 w-64" />
                <Skeleton className="h-6 w-18" />

                <Skeleton className="mt-4 h-7 w-18 rounded-full" />
              </div>

              <div className="flex flex-col gap-4">
                <Skeleton className="h-6 w-38" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-lg bg-zinc-900 p-4 text-center">
                <Skeleton className="mx-auto mb-2 h-6 w-6" />
                <Skeleton className="mx-auto mb-1 h-6 w-12" />
                <Skeleton className="mx-auto mb-1 h-4 w-16" />
                <Skeleton className="mx-auto h-3 w-20" />
              </div>
            ))}
          </div>

          <div>
            <Skeleton className="mb-3 h-6 w-20" />
            <div className="flex flex-wrap gap-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton
                  key={i}
                  className="h-8 w-20 rounded-full bg-zinc-800"
                />
              ))}
            </div>
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
              {[...Array(4)].map((_, i) => (
                <div key={i}>
                  <Skeleton className="mb-1 h-4 w-24" />
                  <Skeleton className="h-5 w-32" />
                </div>
              ))}
            </div>

            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i}>
                  <Skeleton className="mb-1 h-4 w-20" />
                  <div className="flex items-center gap-1">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-5 w-28" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <Skeleton className="h-10 w-20 rounded-lg" />
            <Skeleton className="h-10 w-36 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
