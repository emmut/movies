'use client';

import { ListFilterIcon } from 'lucide-react';
import { parseAsArrayOf, parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { type RefObject, useState } from 'react';

import {
  ClearFiltersButton,
  CompactFilterControls,
  getFilterButtonLabel,
} from '@/components/filters-panel';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { WatchProvider } from '@/types/watch-provider';

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

export function getTotalActiveFilterCount(activeFilterCount: number, genreIds: number[]) {
  return activeFilterCount + genreIds.length;
}

type PendingGenreSelection = {
  baseGenreIds: number[];
  selectedGenreIds: number[];
};

function haveSameGenreIds(left: number[], right: number[]) {
  return left.length === right.length && left.every((genreId, index) => genreId === right[index]);
}

export function getOptimisticGenreIds(
  currentGenreIds: number[],
  pendingSelection: PendingGenreSelection | null,
) {
  if (
    pendingSelection === null ||
    !haveSameGenreIds(currentGenreIds, pendingSelection.baseGenreIds)
  ) {
    return currentGenreIds;
  }

  return pendingSelection.selectedGenreIds;
}

type GenrePillProps = {
  active: boolean;
  genreName: string;
  onToggle: () => void;
};

function GenrePill({ active, genreName, onToggle }: GenrePillProps) {
  return (
    <button type="button" aria-pressed={active} onClick={onToggle}>
      <Pill active={active}>{genreName}</Pill>
    </button>
  );
}

type FilterDropdownProps = {
  genres: Genre[];
  mediaType: 'movie' | 'tv';
  watchProviders: WatchProvider[];
  userRegion: string;
  activeFilterCount: number;
  portalContainer: RefObject<HTMLElement | null>;
  selectedGenreIds: number[];
  onClear: () => void;
  onToggleGenre: (genreId: number) => void;
};

function FilterDropdown({
  genres,
  mediaType,
  watchProviders,
  userRegion,
  activeFilterCount,
  portalContainer,
  selectedGenreIds,
  onClear,
  onToggleGenre,
}: FilterDropdownProps) {
  return (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" />}>
        <ListFilterIcon data-icon="inline-start" />
        {getFilterButtonLabel(activeFilterCount)}
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={12}
        portalContainer={portalContainer}
        className="w-query-container"
      >
        <PopoverHeader className="flex-row items-center justify-between">
          <PopoverTitle>Filters</PopoverTitle>
          <ClearFiltersButton hasSelection={activeFilterCount > 0} onClear={onClear} />
        </PopoverHeader>

        <section className="flex flex-col gap-2" aria-labelledby="genre-filter-heading">
          <h3 id="genre-filter-heading" className="text-sm font-medium">
            Genres
          </h3>
          <ul className="flex flex-wrap gap-2">
            {genres.map((genre) => (
              <li key={genre.id}>
                <GenrePill
                  active={selectedGenreIds.includes(genre.id)}
                  genreName={genre.name}
                  onToggle={() => onToggleGenre(genre.id)}
                />
              </li>
            ))}
          </ul>
        </section>

        <Separator />

        <section className="@container flex flex-col gap-2" aria-labelledby="filter-fields-heading">
          <h3 id="filter-fields-heading" className="text-sm font-medium">
            More filters
          </h3>
          <CompactFilterControls
            mediaType={mediaType}
            watchProviders={watchProviders}
            userRegion={userRegion}
          />
        </section>
      </PopoverContent>
    </Popover>
  );
}

type GenreNavigationClientProps = {
  genres: Genre[];
  mediaType: 'movie' | 'tv';
  watchProviders: WatchProvider[];
  userRegion: string;
  activeFilterCount: number;
  portalContainer: RefObject<HTMLElement | null>;
  onClearFilters: () => Promise<URLSearchParams>;
};

export function GenreNavigationClient({
  genres,
  mediaType,
  watchProviders,
  userRegion,
  activeFilterCount,
  portalContainer,
  onClearFilters,
}: GenreNavigationClientProps) {
  const [urlState, setUrlState] = useQueryStates(
    {
      genreIds: parseAsArrayOf(parseAsInteger).withDefault([]),
      page: parseAsString.withDefault('1'),
    },
    {
      urlKeys: { genreIds: 'genreId' },
      history: 'push',
    },
  );

  const currentGenreIds = urlState.genreIds;
  const [pendingGenreSelection, setPendingGenreSelection] = useState<PendingGenreSelection | null>(
    null,
  );
  const selectedGenreIds = getOptimisticGenreIds(currentGenreIds, pendingGenreSelection);
  const totalActiveFilterCount = getTotalActiveFilterCount(activeFilterCount, selectedGenreIds);

  function handleGenreToggle(genreId: number) {
    const nextGenreIds = toggleGenre(selectedGenreIds, genreId);
    const pendingSelection = { baseGenreIds: currentGenreIds, selectedGenreIds: nextGenreIds };
    setPendingGenreSelection(pendingSelection);
    function clearPendingSelection() {
      setPendingGenreSelection((current) => (current === pendingSelection ? null : current));
    }
    void setUrlState({ genreIds: nextGenreIds, page: '1' }).then(
      clearPendingSelection,
      clearPendingSelection,
    );
  }

  function handleClearAllFilters() {
    const pendingSelection = { baseGenreIds: currentGenreIds, selectedGenreIds: [] };
    setPendingGenreSelection(pendingSelection);
    function clearPendingSelection() {
      setPendingGenreSelection((current) => (current === pendingSelection ? null : current));
    }
    void onClearFilters().then(clearPendingSelection, clearPendingSelection);
  }

  return (
    <nav aria-label="Discover filters" className="min-w-0">
      <div className="@[60rem]:hidden">
        <FilterDropdown
          genres={genres}
          mediaType={mediaType}
          watchProviders={watchProviders}
          userRegion={userRegion}
          activeFilterCount={totalActiveFilterCount}
          portalContainer={portalContainer}
          selectedGenreIds={selectedGenreIds}
          onClear={handleClearAllFilters}
          onToggleGenre={handleGenreToggle}
        />
      </div>

      <div className="hidden @[60rem]:block">
        <ul className="flex max-w-full flex-wrap gap-2 pt-3">
          {genres.map((genre) => (
            <li key={genre.id}>
              <GenrePill
                active={selectedGenreIds.includes(genre.id)}
                genreName={genre.name}
                onToggle={() => handleGenreToggle(genre.id)}
              />
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
