import { fetchAvailableGenres } from '@/lib/movies';
import Link from 'next/link';
import Pill from './pill';

type AvailableGenreProps = {
  currentGenreId?: number;
};

export default async function AvailableGenresNavigation({
  currentGenreId,
}: AvailableGenreProps) {
  const genreId = currentGenreId;
  const genres = await fetchAvailableGenres();

  return (
    <nav>
      <ul className="flex max-w-(--breakpoint-lg) flex-wrap gap-2 pt-3">
        {genres.map((genre) => (
          <li key={genre.id}>
            {genreId === genre.id ? (
              <Link href={`/discover`}>
                <Pill active>{genre.name}</Pill>
              </Link>
            ) : (
              <Link href={`/discover?genreId=${genre.id}`}>
                <Pill>{genre.name}</Pill>
              </Link>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}

AvailableGenresNavigation.Skeleton = function () {
  return (
    <nav>
      <ul className="flex max-w-(--breakpoint-lg) flex-wrap gap-2 pt-3">
        {[...Array(8)].map((_, i) => (
          <li key={i}>
            <Pill variant="skeleton">Loading...</Pill>
          </li>
        ))}
      </ul>
    </nav>
  );
};
