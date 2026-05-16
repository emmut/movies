'use client';

import { useQuery } from '@tanstack/react-query';

import { Route } from '@/routes/discover/$';
import { orpc } from '@/utils/orpc';
import Pill from '@movies/ui/components/pill';

import { GenreNavigationClient } from './genre-navigation-client';

const skeletonItems = [
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
] as const;

function GenreNavigationSkeleton() {
  return (
    <nav>
      <ul className="flex max-w-(--breakpoint-lg) flex-wrap gap-2 pt-3">
        {skeletonItems.map(({ id, className }) => (
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

export function AvailableGenresNavigation() {
  const { mediaType, genreId } = Route.useSearch();

  const { data: genres, isLoading } = useQuery(
    mediaType === 'movie'
      ? orpc.movies.genres.queryOptions()
      : orpc.tv.genres.queryOptions(),
  );

  if (isLoading) return <GenreNavigationSkeleton />;
  if (!genres) return null;

  return <GenreNavigationClient genres={genres} currentGenreId={genreId} />;
}
