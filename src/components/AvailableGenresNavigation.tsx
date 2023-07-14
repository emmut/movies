import Link from 'next/link';
import Pill from './Pill';
import type { Genre } from '@/types/Genre';

type AvailableGenreProps = {
  genres: Genre[];
  currentGenreId?: number;
};

export default async function AvailableGenresNavigation({
  genres,
  currentGenreId,
}: AvailableGenreProps) {
  const genreId = currentGenreId;

  return (
    <nav>
      <ul className="flex max-w-screen-lg flex-wrap gap-2 pt-3">
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
