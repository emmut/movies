import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { SeasonEpisodes } from '@/components/pdp-sections';
import { seasonRouteSchema } from '@/lib/pdp-route-params';

export default async function SeasonPage({
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
    <div className="mx-auto max-w-4xl space-y-6">
      <Link href={`/tv/${tvId}`} className="text-sm text-zinc-400 hover:underline">
        Back to show
      </Link>
      <Suspense fallback={<p>Loading episodes…</p>}>
        <SeasonEpisodes tvId={tvId} seasonNumber={seasonNumber} />
      </Suspense>
    </div>
  );
}
