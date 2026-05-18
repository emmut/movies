import { fetchAvailableGenres } from '@/lib/movies';
import { fetchAvailableTvGenres } from '@/lib/tv-shows';

import GenreFilterClient from './genre-filter-client';

type GenreFilterProps = {
  mediaType?: 'movie' | 'tv';
};

async function GenreFilter({ mediaType = 'movie' }: GenreFilterProps) {
  const genres =
    mediaType === 'movie' ? await fetchAvailableGenres() : await fetchAvailableTvGenres();

  return <GenreFilterClient genres={genres} mediaType={mediaType} />;
}

function GenreFilterSkeleton() {
  return (
    <div className="min-w-54">
      <div className="mb-2 h-5 w-12 animate-pulse rounded bg-muted" />
      <div className="h-8 w-full animate-pulse rounded-lg border border-input bg-muted/40" />
    </div>
  );
}

GenreFilter.Skeleton = GenreFilterSkeleton;
export { GenreFilter };
