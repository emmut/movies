import { useNavigate } from '@tanstack/react-router';
import { useOptimistic, useTransition } from 'react';
import Pill from '@movies/ui/components/pill';

type Genre = {
  id: number;
  name: string;
};

type GenrePillProps = {
  currentGenreId?: number | null;
  genreId: number;
  genreName: string;
  onOptimisticUpdate: (genreId: number) => void;
  onClick: () => void;
};

function GenrePill({
  currentGenreId,
  genreId,
  genreName,
  onOptimisticUpdate,
  onClick,
}: GenrePillProps) {
  const [isPending, startTransition] = useTransition();
  const active = currentGenreId === genreId || isPending;

  return (
    <button
      onClick={() => {
        startTransition(() => {
          onOptimisticUpdate(genreId);
          onClick();
        });
      }}
    >
      <Pill active={active}>{genreName}</Pill>
    </button>
  );
}

type GenreNavigationClientProps = {
  genres: Genre[];
  currentGenreId?: number;
};

export function GenreNavigationClient({ genres, currentGenreId = 0 }: GenreNavigationClientProps) {
  const navigate = useNavigate();
  const [optimisticGenreId, setOptimisticGenreId] = useOptimistic(currentGenreId);

  function handleGenreClick(targetGenreId: number) {
    const nextGenreId = currentGenreId === targetGenreId ? 0 : targetGenreId;
    navigate({
      search: (prev: Record<string, unknown>) => ({
        ...prev,
        genreId: nextGenreId || undefined,
        page: 1,
      }),
    });
  }

  return (
    <nav>
      <ul className="flex max-w-(--breakpoint-lg) flex-wrap gap-2 pt-3">
        {genres.map((genre) => (
          <li key={genre.id}>
            <GenrePill
              currentGenreId={optimisticGenreId}
              genreId={genre.id}
              genreName={genre.name}
              onOptimisticUpdate={setOptimisticGenreId}
              onClick={() => handleGenreClick(genre.id)}
            />
          </li>
        ))}
      </ul>
    </nav>
  );
}
