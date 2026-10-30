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
import { getActiveFilterCount, getAdditionalFilterCount } from '@/components/filters-panel';
import { GenreNavigationClient } from '@/components/genre-navigation-client';
import MediaTypeSelector from '@/components/media-type-selector';
import SectionTitle from '@/components/section-title';
import SkipToElement from '@/components/skip-to-element';
import { getOriginCountryString } from '@/lib/countries';
import { getDiscoverWatchProviders } from '@/lib/discover-params';
import { parseAsPipeSeparatedArrayOfIntegers } from '@/lib/watch-provider-search-params';
import type { Genre } from '@/types/genre';
import type { Keyword } from '@/types/keyword';
import { WatchProvider } from '@/types/watch-provider';

import Pagination from './pagination';

type DiscoverContentProps = {
  keywords: { id: number; name: string }[];
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
  keywordIds: number[];
  mediaType: 'movie' | 'tv';
  sortBy: string;
  watchProviders?: string;
  watchRegion: string;
  runtimeLte?: number;
  originCountry?: string;
  activeFilterCount: number;
  additionalFilterCount: number;
  clearFilters: () => Promise<URLSearchParams>;
  removeKeyword: (id: number) => void;
  addKeyword: (id: number) => void;
};

function useDiscoverViewState(userRegion: string, userWatchProviders: number[]): DiscoverViewState {
  const [urlState, setUrlState] = useQueryStates(
    {
      page: parseAsInteger.withDefault(1),
      keywordIds: parseAsArrayOf(parseAsInteger).withDefault([]),
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
        keywordIds: 'keywordId',
      },
      history: 'push',
    },
  );

  const filterState = {
    sortBy: urlState.sort_by,
    runtimeLte: urlState.runtimeLte,
    originCountries: urlState.with_origin_country,
    watchProviders: urlState.with_watch_providers,
  };

  function clearFilters() {
    return setUrlState(
      {
        genreIds: null,
        keywordIds: null,
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
    keywordIds: urlState.keywordIds,
    addKeyword(id) {
      if (urlState.keywordIds.includes(id)) {
        return;
      }
      void setUrlState({ keywordIds: [...urlState.keywordIds, id], page: 1 }, { shallow: false });
    },
    removeKeyword(id) {
      void setUrlState({
        keywordIds: urlState.keywordIds.filter((keywordId) => keywordId !== id),
        page: 1,
      });
    },
    page: urlState.page,
    genreIds: urlState.genreIds,
    mediaType: urlState.mediaType,
    sortBy: urlState.sort_by,
    // Use the same provider selection as the server: a different value changes the query
    // key, orphans the dehydrated data, and refetches with the wrong filter.
    watchProviders: getDiscoverWatchProviders(
      urlState.with_watch_providers ?? [],
      userWatchProviders,
      urlState.keywordIds,
    ),
    watchRegion: urlState.watch_region ?? userRegion,
    runtimeLte: urlState.runtimeLte ?? undefined,
    originCountry: getOriginCountryString(urlState.with_origin_country),
    activeFilterCount: urlState.keywordIds.length + getActiveFilterCount(filterState),
    additionalFilterCount: getAdditionalFilterCount(filterState),
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
  additionalFilterCount: number;
  keywords: Keyword[];
  onAddKeyword: (id: number) => void;
  onRemoveKeyword: (id: number) => void;
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
  additionalFilterCount,
  keywords,
  onAddKeyword,
  onRemoveKeyword,
  onClearFilters,
}: DiscoverToolbarProps) {
  const toolbarRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={toolbarRef} className="relative mt-6">
      <GenreNavigationClient
        keywords={keywords}
        onAddKeyword={onAddKeyword}
        onRemoveKeyword={onRemoveKeyword}
        genres={genres}
        mediaType={mediaType}
        watchProviders={filteredWatchProviders}
        userRegion={userRegion}
        activeFilterCount={activeFilterCount}
        additionalFilterCount={additionalFilterCount}
        portalContainer={toolbarRef}
        onClearFilters={onClearFilters}
        mediaTypeControls={
          <MediaTypeSelector
            currentMediaType={mediaType}
            movieGenres={movieGenres}
            tvGenres={tvGenres}
          />
        }
      />
    </div>
  );
}

/**
 * Client component that handles the discover page content with React Query.
 * Uses nuqs to manage URL state, which automatically triggers React Query refetches.
 */
export function DiscoverContent({
  keywords,
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
    keywordIds,
    mediaType,
    sortBy,
    watchProviders,
    watchRegion,
    runtimeLte,
    originCountry,
    activeFilterCount,
    additionalFilterCount,
    clearFilters,
    removeKeyword,
    addKeyword,
  } = useDiscoverViewState(userRegion, userWatchProviders);
  const genres = mediaType === 'movie' ? movieGenres : tvGenres;
  const query = {
    page,
    genreIds,
    keywordIds,
    mediaType,
    sortBy,
    watchProviders,
    watchRegion,
    runtimeLte,
    originCountry,
  };

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
        additionalFilterCount={additionalFilterCount}
        keywords={keywords.filter((keyword) => keywordIds.includes(keyword.id))}
        onAddKeyword={addKeyword}
        onRemoveKeyword={removeKeyword}
        onClearFilters={clearFilters}
      />

      <div
        id="content"
        className="mt-7 grid scroll-m-5 grid-cols-2 gap-4 @3xl:grid-cols-4 @8xl:grid-cols-5"
      >
        <DiscoverGrid query={query} userId={userId} />
      </div>
      <Pagination query={query} />
    </div>
  );
}
