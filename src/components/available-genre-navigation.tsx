import { fetchAvailableGenres } from '@/lib/movies';
import { fetchAvailableTvGenres } from '@/lib/tv-shows';
import Link from 'next/link';
import Pill from './pill';

type AvailableGenreProps = {
  currentGenreId?: number;
  mediaType?: 'movie' | 'tv';
  searchParams?: {
    page?: string;
    genreId?: string;
    mediaType?: string;
    sort_by?: string;
    with_watch_providers?: string;
    watch_region?: string;
  };
};

/**
 * Displays a navigation bar of available genres for movies or TV shows, allowing users to filter content by genre.
 *
 * @param currentGenreId - The currently selected genre ID, if any.
 * @param mediaType - The type of media to display genres for; either 'movie' or 'tv'. Defaults to 'movie'.
 * @param searchParams - Current search parameters to preserve when building URLs.
 *
 * @returns A navigation element with genre filter links.
 */
export default async function AvailableGenresNavigation({
  currentGenreId,
  mediaType = 'movie',
  searchParams,
}: AvailableGenreProps) {
  const genreId = currentGenreId;
  const genres =
    mediaType === 'movie'
      ? await fetchAvailableGenres()
      : await fetchAvailableTvGenres();

  function buildDiscoverUrl(targetGenreId?: number) {
    const params = new URLSearchParams();

    if (mediaType !== 'movie') {
      params.set('mediaType', mediaType);
    }

    if (searchParams?.sort_by) {
      params.set('sort_by', searchParams.sort_by);
    }
    if (searchParams?.with_watch_providers) {
      params.set('with_watch_providers', searchParams.with_watch_providers);
    }
    if (searchParams?.watch_region) {
      params.set('watch_region', searchParams.watch_region);
    }

    if (targetGenreId) {
      params.set('genreId', targetGenreId.toString());
    }

    return `/discover${params.toString() ? `?${params.toString()}` : ''}`;
  }

  return (
    <nav>
      <ul className="flex max-w-(--breakpoint-lg) flex-wrap gap-2 pt-3">
        {genres.map((genre) => (
          <li key={genre.id}>
            <Link
              href={
                genreId === genre.id
                  ? buildDiscoverUrl()
                  : buildDiscoverUrl(genre.id)
              }
            >
              <Pill active={genreId === genre.id}>{genre.name}</Pill>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

const availableGenresSkeleton = [
  { id: 1, className: 'w-18' },
  { id: 2, className: 'w-24' },
  { id: 3, className: 'w-32' },
  { id: 4, className: 'w-24' },
  { id: 5, className: 'w-24' },
  { id: 6, className: 'w-18' },
  { id: 7, className: 'w-24' },
  { id: 8, className: 'w-16' },
  { id: 9, className: 'w-24' },
  { id: 10, className: 'w-32' },
  { id: 11, className: 'w-24' },
  { id: 12, className: 'w-36' },
  { id: 13, className: 'w-19' },
  { id: 14, className: 'w-28' },
  { id: 15, className: 'w-19' },
  { id: 16, className: 'w-36' },
] as const;

/**
 * Displays a skeleton navigation UI with placeholder genre pills to indicate loading state.
 */
function AvailableGenresNavigationSkeleton() {
  return (
    <nav>
      <ul className="flex max-w-(--breakpoint-lg) flex-wrap gap-2 pt-3">
        {availableGenresSkeleton.map(({ id, className }) => (
          <li key={id}>
            <Pill variant="skeleton" className={className}>
              Loading...
            </Pill>
          </li>
        ))}
      </ul>
    </nav>
  );
}

AvailableGenresNavigation.Skeleton = AvailableGenresNavigationSkeleton;
