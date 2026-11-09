'use client';

import { useQueryStates } from 'nuqs';
import { useRef } from 'react';

import DiscoverGrid from '@/components/discover-grid';
import { GenreNavigationClient } from '@/components/genre-navigation-client';
import MediaTypeSelector from '@/components/media-type-selector';
import SectionTitle from '@/components/section-title';
import SkipToElement from '@/components/skip-to-element';
import {
  discoverViewParsers,
  discoverViewUrlKeys,
  resolveDiscoverViewState,
} from '@/lib/discover-view-state';
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

type DiscoverViewState = ReturnType<typeof resolveDiscoverViewState> & {
  clearFilters: () => Promise<URLSearchParams>;
  removeKeyword: (id: number) => void;
  addKeyword: (id: number) => void;
};

function useDiscoverViewState(userRegion: string, userWatchProviders: number[]): DiscoverViewState {
  const [urlState, setUrlState] = useQueryStates(discoverViewParsers, {
    urlKeys: discoverViewUrlKeys,
    history: 'push',
  });

  function clearFilters() {
    return setUrlState(
      {
        genreIds: null,
        keywordIds: null,
        companyIds: null,
        networkIds: null,
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
    ...resolveDiscoverViewState(urlState, {
      region: userRegion,
      watchProviders: userWatchProviders,
    }),
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
    companyIds,
    networkIds,
    mediaType,
    sortBy,
    watchProviders,
    watchRegion,
    runtimeLte,
    originCountry,
    activeFilterCount,
    clearFilters,
    removeKeyword,
    addKeyword,
  } = useDiscoverViewState(userRegion, userWatchProviders);
  const genres = mediaType === 'movie' ? movieGenres : tvGenres;
  const query = {
    page,
    genreIds,
    keywordIds,
    companyIds,
    networkIds,
    mediaType,
    sortBy,
    watchProviders,
    watchRegion,
    runtimeLte,
    originCountry,
  };

  return (
    <div className="@container/discover w-full">
      <DiscoverHeader />
      <DiscoverToolbar
        genres={genres}
        mediaType={mediaType}
        movieGenres={movieGenres}
        tvGenres={tvGenres}
        filteredWatchProviders={filteredWatchProviders}
        userRegion={watchRegion}
        activeFilterCount={activeFilterCount}
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
