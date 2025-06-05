export default function LoadingMovies() {
  return (
    <div className="min-h-screen">
      <div className="mb-6">
        <div className="h-10 w-24 animate-pulse rounded-md bg-neutral-50/10"></div>
      </div>

      <div className="relative -mx-4 mb-8 h-64 md:h-80 lg:h-96">
        <div className="h-full w-full animate-pulse bg-neutral-50/10"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
        <div className="absolute right-4 bottom-4 left-4">
          <div className="mb-2 h-8 w-3/4 animate-pulse rounded bg-neutral-50/20 md:h-10 lg:h-12"></div>
          <div className="h-6 w-1/2 animate-pulse rounded bg-neutral-50/15 md:h-7"></div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <div className="mx-auto aspect-2/3 w-full max-w-md animate-pulse rounded-lg bg-neutral-50/10 shadow-2xl"></div>
        </div>

        <div className="space-y-6 lg:col-span-8">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-lg bg-zinc-900 p-4 text-center">
                <div className="mx-auto mb-2 h-6 w-6 animate-pulse rounded bg-neutral-50/20"></div>
                <div className="mx-auto mb-1 h-6 w-12 animate-pulse rounded bg-neutral-50/20"></div>
                <div className="mx-auto mb-1 h-4 w-16 animate-pulse rounded bg-neutral-50/15"></div>
                <div className="mx-auto h-3 w-20 animate-pulse rounded bg-neutral-50/10"></div>
              </div>
            ))}
          </div>

          <div>
            <div className="mb-3 h-6 w-20 animate-pulse rounded bg-neutral-50/20"></div>
            <div className="flex flex-wrap gap-2">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-8 w-20 animate-pulse rounded-full bg-zinc-800"
                ></div>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-3 h-6 w-24 animate-pulse rounded bg-neutral-50/20"></div>
            <div className="space-y-2">
              <div className="h-4 w-full animate-pulse rounded bg-neutral-50/15"></div>
              <div className="h-4 w-full animate-pulse rounded bg-neutral-50/15"></div>
              <div className="h-4 w-3/4 animate-pulse rounded bg-neutral-50/15"></div>
              <div className="h-4 w-full animate-pulse rounded bg-neutral-50/15"></div>
              <div className="h-4 w-2/3 animate-pulse rounded bg-neutral-50/15"></div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i}>
                  <div className="mb-1 h-4 w-24 animate-pulse rounded bg-neutral-50/15"></div>
                  <div className="h-5 w-32 animate-pulse rounded bg-neutral-50/20"></div>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i}>
                  <div className="mb-1 h-4 w-20 animate-pulse rounded bg-neutral-50/15"></div>
                  <div className="flex items-center gap-1">
                    <div className="h-4 w-4 animate-pulse rounded bg-neutral-50/15"></div>
                    <div className="h-5 w-28 animate-pulse rounded bg-neutral-50/20"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="h-10 w-20 animate-pulse rounded-lg bg-neutral-50/20"></div>
            <div className="h-10 w-36 animate-pulse rounded-lg bg-neutral-50/15"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
