import { Skeleton } from '@movies/ui/components/skeleton';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { SeasonEpisodes } from '@/components/season-episodes';
import { seasonRouteSchema } from '@/lib/pdp-route-params';

async function SeasonContent({
  params,
}: {
  params: Promise<{ tvId: string; seasonNumber: string }>;
}) {
  const result = seasonRouteSchema.safeParse(await params);
  if (!result.success) {
    notFound();
  }
  const { tvId, seasonNumber } = result.data;
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <Link
        href={`/tv/${tvId}`}
        className="inline-flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to show
      </Link>
      <Suspense fallback={<SeasonSkeleton />}>
        <SeasonEpisodes tvId={tvId} seasonNumber={seasonNumber} />
      </Suspense>
    </div>
  );
}

function SeasonSkeleton() {
  return (
    <div className="space-y-8" aria-label="Loading episodes">
      <Skeleton className="h-44 rounded-2xl" />
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="aspect-4/3 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default function SeasonPage({
  params,
}: {
  params: Promise<{ tvId: string; seasonNumber: string }>;
}) {
  return (
    <Suspense fallback={<SeasonSkeleton />}>
      <SeasonContent params={params} />
    </Suspense>
  );
}
