'use client';

import Link from 'next/link';
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
  href: string;
  onOptimisticUpdate: (genreId: number) => void;
};

function GenrePill({
  currentGenreId,
  genreId,
  genreName,
  href,
  onOptimisticUpdate,
}: GenrePillProps) {
  const [isPending, startTransition] = useTransition();

  const active = currentGenreId === genreId || isPending;

  return (
    <Link
      href={href}
      onClick={() => {
        startTransition(() => {
          onOptimisticUpdate(genreId);
        });
      }}
    >
      <Pill active={active}>{genreName}</Pill>
    </Link>
  );
}

type GenreNavigationClientProps = {
  genres: Genre[];
  currentGenreId?: number;
  mediaType: 'movie' | 'tv';
  searchParams?: {
    page?: string;
    genreId?: string;
    mediaType?: string;
    sort_by?: string;
    with_watch_providers?: string;
    watch_region?: string;
  };
};

export function GenreNavigationClient({
  genres,
  currentGenreId,
  mediaType,
  searchParams,
}: GenreNavigationClientProps) {
  const [optimisticGenreId, setOptimisticGenreId] =
    useOptimistic(currentGenreId);

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
            <GenrePill
              currentGenreId={optimisticGenreId}
              genreId={genre.id}
              genreName={genre.name}
              href={
                currentGenreId === genre.id
                  ? buildDiscoverUrl()
                  : buildDiscoverUrl(genre.id)
              }
              onOptimisticUpdate={setOptimisticGenreId}
            />
          </li>
        ))}
      </ul>
    </nav>
  );
}
