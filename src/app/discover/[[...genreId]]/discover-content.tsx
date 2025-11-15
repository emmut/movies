'use client';

import DiscoverGrid from '@/components/discover-grid';
import FiltersPanel from '@/components/filters-panel';
import MediaTypeSelector from '@/components/media-type-selector';
import SectionTitle from '@/components/section-title';
import SkipToElement from '@/components/skip-to-element';
import { parseAsPipeSeparatedArrayOfIntegers } from '@/lib/watch-provider-search-params';
import { WatchProvider } from '@/types/watch-provider';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { ReactNode, Suspense } from 'react';
import Pagination from './pagination';

type DiscoverContentProps = {
  filteredWatchProviders: WatchProvider[];
  userRegion: string;
  genreNavigation: ReactNode;
  userId?: string;
};

/**
 * Client component that handles the discover page content with React Query.
 * Uses nuqs to manage URL state, which automatically triggers React Query refetches.
 */
export function DiscoverContent({
  filteredWatchProviders,
  userRegion,
  genreNavigation,
  userId,
}: DiscoverContentProps) {
  // Use nuqs to manage URL state - changes automatically trigger React Query refetches
  const [urlState] = useQueryStates(
    {
      page: parseAsInteger.withDefault(1),
      genreId: parseAsInteger.withDefault(0),
      mediaType: parseAsString.withDefault('movie'),
      sort_by: parseAsString,
      with_watch_providers: parseAsPipeSeparatedArrayOfIntegers,
      watch_region: parseAsString,
      with_runtime_lte: parseAsInteger,
    },
    {
      history: 'push',
    }
  );

  const genreId = urlState.genreId;
  const page = urlState.page;
  const mediaType = urlState.mediaType as 'movie' | 'tv';
  const sortBy = urlState.sort_by || undefined;
  const watchProviders = urlState.with_watch_providers?.join('|') || undefined;
  const watchRegion = urlState.watch_region || userRegion;
  const runtimeLte = urlState.with_runtime_lte || undefined;

  return (
    <>
      <div className="flex items-center gap-4">
        <SectionTitle>Discover</SectionTitle>

        <SkipToElement elementId="content-container">
          Skip to content
        </SkipToElement>
      </div>

      <div className="relative mt-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-wrap gap-2">{genreNavigation}</div>
        <Suspense>
          <MediaTypeSelector currentMediaType={mediaType} />
        </Suspense>
      </div>

      <div className="mt-6">
        <Suspense>
          <FiltersPanel
            mediaType={mediaType}
            watchProviders={filteredWatchProviders}
            userRegion={watchRegion}
          />
        </Suspense>
      </div>

      <div
        id="content-container"
        tabIndex={0}
        className="mt-7 grid scroll-m-5 grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5"
      >
        <Suspense>
          <DiscoverGrid
            currentGenreId={genreId}
            currentPage={page}
            mediaType={mediaType}
            sortBy={sortBy}
            watchProviders={watchProviders}
            watchRegion={watchRegion}
            runtimeLte={runtimeLte}
            userId={userId}
          />
        </Suspense>
      </div>

      <Pagination
        currentGenreId={genreId}
        currentPage={page}
        mediaType={mediaType}
        sortBy={sortBy}
        watchProviders={watchProviders}
        watchRegion={watchRegion}
        runtimeLte={runtimeLte}
      />
    </>
  );
}
