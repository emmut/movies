import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div>
      <div className="mb-6">
        <Skeleton className="h-10 w-24" />

        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Skeleton className="mx-auto aspect-2/3 w-full max-w-64 rounded-lg shadow-2xl sm:mx-0 lg:max-w-full" />
          </div>

          <div className="space-y-5 lg:col-span-8">
            <div className="space-y-2">
              <Skeleton className="h-12 w-64" />
              <Skeleton className="h-6 w-36" />
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="rounded-lg bg-zinc-900 p-4 text-center">
                  <Skeleton className="mx-auto mb-2 h-6 w-6" />
                  <Skeleton className="mx-auto mb-1 h-8 w-12" />
                  <Skeleton className="mx-auto h-4 w-16" />
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
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-7 w-16 rounded-full" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
