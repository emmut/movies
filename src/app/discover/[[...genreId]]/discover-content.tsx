'use client';

import { parseAsInteger, parseAsString, parseAsStringLiteral, useQueryStates } from 'nuqs';

import DiscoverGrid from '@/components/discover-grid';
import FiltersPanel from '@/components/filters-panel';
import { GenreNavigationClient } from '@/components/genre-navigation-client';
import MediaTypeSelector from '@/components/media-type-selector';
import SectionTitle from '@/components/section-title';
import SkipToElement from '@/components/skip-to-element';
import { useScrollOnPageChange } from '@/hooks/use-scroll-on-page-change';
import { parseAsPipeSeparatedArrayOfIntegers } from '@/lib/watch-provider-search-params';
import type { Genre } from '@/types/genre';
import { WatchProvider } from '@/types/watch-provider';

import Pagination from './pagination';

type DiscoverContentProps = {
  filteredWatchProviders: WatchProvider[];
  userRegion: string;
  movieGenres: Genre[];
  tvGenres: Genre[];
  userId?: string;
};

type DiscoverViewState = {
  page: number;
  genreId: number;
  mediaType: 'movie' | 'tv';
  sortBy: string;
  watchProviders?: string;
  watchRegion: string;
  runtimeLte?: number;
};

function useDiscoverViewState(userRegion: string): DiscoverViewState {
  const [urlState] = useQueryStates(
    {
      page: parseAsInteger.withDefault(1),
      genreId: parseAsInteger.withDefault(0),
      mediaType: parseAsStringLiteral(['movie', 'tv'] as const).withDefault('movie'),
      sort_by: parseAsString.withDefault('popularity.desc'),
      with_watch_providers: parseAsPipeSeparatedArrayOfIntegers,
      watch_region: parseAsString,
      runtimeLte: parseAsInteger,
    },
    {
      urlKeys: {
        runtimeLte: 'runtime',
      },
      history: 'push',
    },
  );

  return {
    page: urlState.page,
    genreId: urlState.genreId,
    mediaType: urlState.mediaType,
    sortBy: urlState.sort_by,
    watchProviders: urlState.with_watch_providers?.join('|'),
    watchRegion: urlState.watch_region ?? userRegion,
    runtimeLte: urlState.runtimeLte ?? undefined,
  };
}

function DiscoverHeader() {
  return (
    <div className="flex items-center gap-4">
      <SectionTitle>Discover</SectionTitle>
      <SkipToElement elementId="content-container">Skip to content</SkipToElement>
    </div>
  );
}

type DiscoverToolbarProps = {
  genres: Genre[];
  mediaType: 'movie' | 'tv';
  movieGenres: Genre[];
  tvGenres: Genre[];
};

function DiscoverToolbar({ genres, mediaType, movieGenres, tvGenres }: DiscoverToolbarProps) {
  return (
    <div className="@container relative mt-4 flex flex-col gap-4 @2xl:flex-row @2xl:items-center @2xl:justify-between">
      <div className="flex flex-1 flex-wrap gap-2">
        <GenreNavigationClient genres={genres} />
      </div>
      <MediaTypeSelector
        currentMediaType={mediaType}
        movieGenres={movieGenres}
        tvGenres={tvGenres}
      />
    </div>
  );
}

type DiscoverResultsProps = DiscoverViewState & {
  userId?: string;
};

function DiscoverResults({
  page,
  genreId,
  mediaType,
  sortBy,
  watchProviders,
  watchRegion,
  runtimeLte,
  userId,
}: DiscoverResultsProps) {
  return (
    <div
      id="content-container"
      className="@8xl:grid-cols-5 mt-7 grid scroll-m-5 grid-cols-2 gap-4 @3xl:grid-cols-4"
    >
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
    </div>
  );
}

/**
 * Client component that handles the discover page content with React Query.
 * Uses nuqs to manage URL state, which automatically triggers React Query refetches.
 */
export function DiscoverContent({
  filteredWatchProviders,
  userRegion,
  movieGenres,
  tvGenres,
  userId,
}: DiscoverContentProps) {
  const { page, genreId, mediaType, sortBy, watchProviders, watchRegion, runtimeLte } =
    useDiscoverViewState(userRegion);
  const genres = mediaType === 'movie' ? movieGenres : tvGenres;

  useScrollOnPageChange(page, genreId);

  return (
    <div className="@container w-full">
      <DiscoverHeader />
      <DiscoverToolbar
        genres={genres}
        mediaType={mediaType}
        movieGenres={movieGenres}
        tvGenres={tvGenres}
      />

      <div className="mt-6">
        <FiltersPanel
          mediaType={mediaType}
          watchProviders={filteredWatchProviders}
          userRegion={watchRegion}
        />
      </div>

      <DiscoverResults
        page={page}
        genreId={genreId}
        mediaType={mediaType}
        sortBy={sortBy}
        watchProviders={watchProviders}
        watchRegion={watchRegion}
        runtimeLte={runtimeLte}
        userId={userId}
      />

      <Pagination
        currentGenreId={genreId}
        currentPage={page}
        mediaType={mediaType}
        sortBy={sortBy}
        watchProviders={watchProviders}
        watchRegion={watchRegion}
        runtimeLte={runtimeLte}
      />
    </div>
  );
}
