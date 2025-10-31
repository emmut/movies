'use client';

import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { useOptimistic, useTransition } from 'react';
import Pill from './pill';

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
  mediaType: 'movie' | 'tv';
};

export function GenreNavigationClient({ genres }: GenreNavigationClientProps) {
  // Read current genre from URL state
  const [urlState, setUrlState] = useQueryStates({
    genreId: parseAsInteger.withDefault(0),
    page: parseAsString.withDefault('1'),
  });

  const currentGenreId = urlState.genreId;
  const [optimisticGenreId, setOptimisticGenreId] =
    useOptimistic(currentGenreId);

  function handleGenreClick(targetGenreId: number) {
    // If clicking the same genre, clear it (set to 0)
    // Otherwise, set the new genre and reset to page 1
    setUrlState({
      genreId: currentGenreId === targetGenreId ? 0 : targetGenreId,
      page: '1',
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
