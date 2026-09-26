'use client';

import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from 'nuqs';
import { useRef } from 'react';

import DiscoverGrid from '@/components/discover-grid';
import FiltersPanel, { getActiveFilterCount } from '@/components/filters-panel';
import { GenreNavigationClient } from '@/components/genre-navigation-client';
import MediaTypeSelector from '@/components/media-type-selector';
import SectionTitle from '@/components/section-title';
import SkipToElement from '@/components/skip-to-element';
import { getOriginCountryString } from '@/lib/countries';
import {
  getWatchProvidersString,
  parseAsPipeSeparatedArrayOfIntegers,
} from '@/lib/watch-provider-search-params';
import type { Genre } from '@/types/genre';
import { WatchProvider } from '@/types/watch-provider';

import Pagination from './pagination';

type DiscoverContentProps = {
  filteredWatchProviders: WatchProvider[];
  userRegion: string;
  userWatchProviders: number[];
  movieGenres: Genre[];
  tvGenres: Genre[];
  userId?: string;
};

type DiscoverViewState = {
  page: number;
  genreIds: number[];
  mediaType: 'movie' | 'tv';
  sortBy: string;
  watchProviders?: string;
  watchRegion: string;
  runtimeLte?: number;
  originCountry?: string;
  activeFilterCount: number;
  clearFilters: () => Promise<URLSearchParams>;
};

function useDiscoverViewState(userRegion: string, userWatchProviders: number[]): DiscoverViewState {
  const [urlState, setUrlState] = useQueryStates(
    {
      page: parseAsInteger.withDefault(1),
      genreIds: parseAsArrayOf(parseAsInteger).withDefault([]),
      mediaType: parseAsStringLiteral(['movie', 'tv'] as const).withDefault('movie'),
      sort_by: parseAsString.withDefault('popularity.desc'),
      with_watch_providers: parseAsPipeSeparatedArrayOfIntegers,
      with_origin_country: parseAsArrayOf(parseAsString).withDefault([]),
      watch_region: parseAsString,
      runtimeLte: parseAsInteger,
    },
    {
      urlKeys: {
        runtimeLte: 'runtime',
        genreIds: 'genreId',
      },
      history: 'push',
    },
  );

  function clearFilters() {
    return setUrlState(
      {
        genreIds: null,
        sort_by: null,
        runtimeLte: null,
        with_origin_country: null,
        with_watch_providers: null,
        watch_region: null,
        page: 1,
      },
      { shallow: false },
    );
  }

  return {
    page: urlState.page,
    genreIds: urlState.genreIds,
    mediaType: urlState.mediaType,
    sortBy: urlState.sort_by,
    // Same fallback the server prefetch applies (URL selection, else the
    // user's saved providers): a different value here changes the React Query
    // key, orphans the dehydrated data, and refetches with the wrong filter.
    watchProviders: getWatchProvidersString(
      urlState.with_watch_providers ?? [],
      userWatchProviders,
    ),
    watchRegion: urlState.watch_region ?? userRegion,
    runtimeLte: urlState.runtimeLte ?? undefined,
    originCountry: getOriginCountryString(urlState.with_origin_country),
    activeFilterCount: getActiveFilterCount({
      sortBy: urlState.sort_by,
      runtimeLte: urlState.runtimeLte,
      originCountries: urlState.with_origin_country,
      watchProviders: urlState.with_watch_providers,
    }),
    clearFilters,
  };
}

function DiscoverHeader() {
  return (
    <div className="flex items-center gap-4">
      <SectionTitle>Discover</SectionTitle>
      <SkipToElement elementId="content">Skip to content</SkipToElement>
    </div>
  );
}

type DiscoverToolbarProps = {
  genres: Genre[];
  mediaType: 'movie' | 'tv';
  movieGenres: Genre[];
  tvGenres: Genre[];
  filteredWatchProviders: WatchProvider[];
  userRegion: string;
  activeFilterCount: number;
  hasActiveFilters: boolean;
  onClearFilters: () => Promise<URLSearchParams>;
};

function DiscoverToolbar({
  genres,
  mediaType,
  movieGenres,
  tvGenres,
  filteredWatchProviders,
  userRegion,
  activeFilterCount,
  hasActiveFilters,
  onClearFilters,
}: DiscoverToolbarProps) {
  const toolbarRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={toolbarRef}
      className="@container relative mt-4 flex flex-wrap items-center gap-x-2 gap-y-4"
    >
      <div className="min-w-0 @[60rem]:flex-1">
        <GenreNavigationClient
          genres={genres}
          mediaType={mediaType}
          watchProviders={filteredWatchProviders}
          userRegion={userRegion}
          activeFilterCount={activeFilterCount}
          portalContainer={toolbarRef}
          onClearFilters={onClearFilters}
        />
      </div>
      <FiltersPanel
        mediaType={mediaType}
        watchProviders={filteredWatchProviders}
        userRegion={userRegion}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={onClearFilters}
      />
      <div className="ml-auto @[60rem]:pl-1">
        <MediaTypeSelector
          currentMediaType={mediaType}
          movieGenres={movieGenres}
          tvGenres={tvGenres}
        />
      </div>
    </div>
  );
}

type DiscoverResultsProps = Omit<DiscoverViewState, 'activeFilterCount' | 'clearFilters'> & {
  userId?: string;
};

function DiscoverResults({
  page,
  genreIds,
  mediaType,
  sortBy,
  watchProviders,
  watchRegion,
  runtimeLte,
  originCountry,
  userId,
}: DiscoverResultsProps) {
  return (
    <div
      id="content"
      className="mt-7 grid scroll-m-5 grid-cols-2 gap-4 @3xl:grid-cols-4 @8xl:grid-cols-5"
    >
      <DiscoverGrid
        currentGenreIds={genreIds}
        currentPage={page}
        mediaType={mediaType}
        sortBy={sortBy}
        watchProviders={watchProviders}
        watchRegion={watchRegion}
        runtimeLte={runtimeLte}
        originCountry={originCountry}
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
  userWatchProviders,
  movieGenres,
  tvGenres,
  userId,
}: DiscoverContentProps) {
  const {
    page,
    genreIds,
    mediaType,
    sortBy,
    watchProviders,
    watchRegion,
    runtimeLte,
    originCountry,
    activeFilterCount,
    clearFilters,
  } = useDiscoverViewState(userRegion, userWatchProviders);
  const genres = mediaType === 'movie' ? movieGenres : tvGenres;

  return (
    <div className="@container w-full">
      <DiscoverHeader />
      <DiscoverToolbar
        genres={genres}
        mediaType={mediaType}
        movieGenres={movieGenres}
        tvGenres={tvGenres}
        filteredWatchProviders={filteredWatchProviders}
        userRegion={watchRegion}
        activeFilterCount={activeFilterCount}
        hasActiveFilters={genreIds.length + activeFilterCount > 0}
        onClearFilters={clearFilters}
      />

      <DiscoverResults
        page={page}
        genreIds={genreIds}
        mediaType={mediaType}
        sortBy={sortBy}
        watchProviders={watchProviders}
        watchRegion={watchRegion}
        runtimeLte={runtimeLte}
        originCountry={originCountry}
        userId={userId}
      />

      <Pagination
        currentGenreIds={genreIds}
        currentPage={page}
        mediaType={mediaType}
        sortBy={sortBy}
        watchProviders={watchProviders}
        watchRegion={watchRegion}
        runtimeLte={runtimeLte}
        originCountry={originCountry}
      />
    </div>
  );
}
