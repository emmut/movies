import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { SeasonEpisodes } from '@/components/pdp-sections';

export default async function SeasonPage({
  params,
}: {
  params: Promise<{ tvId: string; seasonNumber: string }>;
}) {
  const { tvId, seasonNumber } = await params;
  if (
    !/^\d+$/.test(tvId) ||
    !/^\d+$/.test(seasonNumber) ||
    Number(tvId) < 1 ||
    !Number.isSafeInteger(Number(tvId)) ||
    !Number.isSafeInteger(Number(seasonNumber))
  )
    notFound();
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link href={`/tv/${tvId}`} className="text-sm text-zinc-400 hover:underline">
        Back to show
      </Link>
      <Suspense fallback={<p>Loading episodes…</p>}>
        <SeasonEpisodes tvId={Number(tvId)} seasonNumber={Number(seasonNumber)} />
      </Suspense>
    </div>
  );
}
