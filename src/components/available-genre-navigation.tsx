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
            <Link href={`/discover/${genre.id}`}>
              <Pill active={genreId === genre.id}>{genre.name}</Pill>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
