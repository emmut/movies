import { fetchAvailableGenres } from '@/lib/movies';
import { fetchAvailableTvGenres } from '@/lib/tv-shows';
import Link from 'next/link';
import Pill from './pill';

type AvailableGenreProps = {
  currentGenreId?: number;
  mediaType?: 'movie' | 'tv';
};

/**
 * Displays a navigation bar of available genres for movies or TV shows, allowing users to filter content by genre.
 *
 * @param currentGenreId - The currently selected genre ID, if any.
 * @param mediaType - The type of media to display genres for; either 'movie' or 'tv'. Defaults to 'movie'.
 *
 * @returns A navigation element with genre filter links.
 */
export default async function AvailableGenresNavigation({
  currentGenreId,
  mediaType = 'movie',
}: AvailableGenreProps) {
  const genreId = currentGenreId;
  const genres =
    mediaType === 'movie'
      ? await fetchAvailableGenres()
      : await fetchAvailableTvGenres();

  const buildDiscoverUrl = (targetGenreId?: number) => {
    const params = new URLSearchParams();
    if (mediaType !== 'movie') {
      params.set('mediaType', mediaType);
    }
    if (targetGenreId) {
      params.set('genreId', targetGenreId.toString());
    }

    return `/discover${params.toString() ? `?${params.toString()}` : ''}`;
  };

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

/**
 * Displays a skeleton navigation UI with placeholder genre pills to indicate loading state.
 */
function AvailableGenresNavigationSkeleton() {
  return (
    <nav>
      <ul className="flex max-w-(--breakpoint-lg) flex-wrap gap-2 pt-3">
        {[...Array(13)].map((_, i) => (
          <li key={i}>
            <Pill variant="skeleton">Loading...</Pill>
          </li>
        ))}
      </ul>
    </nav>
  );
}

AvailableGenresNavigation.Skeleton = AvailableGenresNavigationSkeleton;
