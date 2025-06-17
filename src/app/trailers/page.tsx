import MediaTypeSelector from '@/components/media-type-selector';
import { PageHeader } from '@/components/page-header';
import { PaginationControls } from '@/components/pagination-controls';
import { getLatestTrailers } from '@/lib/api/tmdb';
import { Suspense } from 'react';
import { TrailerGrid } from './trailer-grid';

type TrailersPageProps = {
  searchParams: Promise<{
    mediaType?: string;
    page?: string;
  }>;
};

function TrailersSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="aspect-video animate-pulse rounded-lg bg-zinc-800"
        />
      ))}
    </div>
  );
}

async function TrailersContent({
  mediaType,
  page,
}: {
  mediaType: 'movie' | 'tv';
  page: number;
}) {
  const { trailers, totalPages } = await getLatestTrailers({
    mediaType,
    page,
  });

  return (
    <div className="space-y-8">
      <TrailerGrid trailers={trailers} />

      {totalPages > 1 && (
        <div className="flex justify-center">
          <PaginationControls totalPages={totalPages} pageType="trailers" />
        </div>
      )}
    </div>
  );
}

export default async function TrailersPage(props: TrailersPageProps) {
  const searchParams = await props.searchParams;
  const mediaType = (searchParams.mediaType ?? 'movie') as 'movie' | 'tv';
  const page = parseInt(searchParams.page ?? '1', 10);

  return (
    <div className="container space-y-8 pb-8">
      <PageHeader
        title="Trailers"
        description={`The latest ${mediaType === 'movie' ? 'film' : 'TV-series'} trailers`}
      />

      <div className="flex justify-center">
        <MediaTypeSelector currentMediaType={mediaType} />
      </div>

      <Suspense key={`${mediaType}-${page}`} fallback={<TrailersSkeleton />}>
        <TrailersContent mediaType={mediaType} page={page} />
      </Suspense>
    </div>
  );
}
