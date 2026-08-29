'use client';

import { parseAsArrayOf, parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { useOptimistic, useTransition } from 'react';

import Pill from './pill';

type Genre = {
  id: number;
  name: string;
};

export function toggleGenre(genreIds: number[], genreId: number) {
  return genreIds.includes(genreId)
    ? genreIds.filter((id) => id !== genreId)
    : [...genreIds, genreId];
}

type GenrePillProps = {
  active: boolean;
  genreName: string;
  onToggle: () => void;
};

function GenrePill({ active, genreName, onToggle }: GenrePillProps) {
  // Wrapping the toggle in a transition lets useOptimistic show the new
  // selection instantly while the route update settles.
  const [, startTransition] = useTransition();

  return (
    <button
      aria-pressed={active}
      onClick={() => {
        startTransition(onToggle);
      }}
    >
      <Pill active={active}>{genreName}</Pill>
    </button>
  );
}

type GenreNavigationClientProps = {
  genres: Genre[];
};

export function GenreNavigationClient({ genres }: GenreNavigationClientProps) {
  const [urlState, setUrlState] = useQueryStates(
    {
      genreIds: parseAsArrayOf(parseAsInteger).withDefault([]),
      page: parseAsString.withDefault('1'),
    },
    {
      urlKeys: { genreIds: 'genreId' },
    },
  );

  const currentGenreIds = urlState.genreIds;
  const [optimisticGenreIds, setOptimisticGenreIds] = useOptimistic(currentGenreIds);

  function handleGenreToggle(genreId: number) {
    const nextGenreIds = toggleGenre(currentGenreIds, genreId);
    setOptimisticGenreIds(nextGenreIds);
    // Empty selection equals the default, so nuqs drops genreId from the URL
    setUrlState({ genreIds: nextGenreIds, page: '1' });
  }

  return (
    <nav className="min-w-0">
      <ul className="flex max-w-full flex-wrap gap-2 pt-3">
        {genres.map((genre) => (
          <li key={genre.id}>
            <GenrePill
              active={optimisticGenreIds.includes(genre.id)}
              genreName={genre.name}
              onToggle={() => handleGenreToggle(genre.id)}
            />
          </li>
        ))}
      </ul>
    </nav>
  );
}
