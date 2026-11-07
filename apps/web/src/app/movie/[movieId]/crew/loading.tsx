import { Skeleton } from '@movies/ui/components/skeleton';

export default function Loading() {
  return (
    <div className="mx-auto min-h-screen max-w-3xl" aria-label="Loading crew" aria-busy="true">
      <Skeleton className="mb-6 h-11 w-40" />
      <h1 className="mb-1 text-3xl font-bold">Full crew</h1>
      <Skeleton className="mb-8 h-6 w-56" />
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 8 }, (_, index) => (
          <Skeleton key={index} className="h-16 w-full" />
        ))}
      </div>
    </div>
  );
}
