'use client';

import { WatchProvider } from '@movies/api/tmdb-types/watch-provider';
import { Button } from '@movies/ui/components/button';
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@movies/ui/components/popover';
import { Separator } from '@movies/ui/components/separator';
import { cn } from 'cn';
import { ListFilterIcon } from 'lucide-react';
import { parseAsArrayOf, parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { type ReactNode, type RefObject, useState } from 'react';

import { DiscoverKeywords } from '@/components/discover-keywords';
import { FilterCount } from '@/components/filter-count';
import {
  ClearFiltersButton,
  FilterControls,
  getFilterButtonLabel,
} from '@/components/filters-panel';
import { OrganizationFilter } from '@/components/organization-filter';
import { SelectedFilterChips } from '@/components/selected-filter-chips';
import { useResponsivePopover } from '@/hooks/use-responsive-popover';
import type { Keyword } from '@/types/keyword';

import Pill from './pill';
import SortByFilter from './sort-by-filter';

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

function GenreList({
  genres,
  selectedIds,
  onToggle,
}: {
  genres: Genre[];
  selectedIds: number[];
  onToggle: (id: number) => void;
}) {
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Genres">
      {genres.map((genre) => (
        <li key={genre.id}>
          <GenrePill
            active={selectedIds.includes(genre.id)}
            genreName={genre.name}
            onToggle={() => onToggle(genre.id)}
          />
        </li>
      ))}
    </ul>
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
  keywordControls: ReactNode;
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
  keywordControls,
  onClear,
  onToggleGenre,
}: FilterDropdownProps) {
  const { open, setOpen, triggerRef } = useResponsivePopover();
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        ref={triggerRef}
        render={<Button variant="outline" />}
        aria-label={getFilterButtonLabel(activeFilterCount)}
        className={cn(
          'relative h-10 gap-2 px-4',
          activeFilterCount > 0 && 'border-primary/40 bg-primary/5',
        )}
      >
        <ListFilterIcon className="size-4" aria-hidden="true" />
        Filters
        <FilterCount count={activeFilterCount} />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={12}
        portalContainer={portalContainer}
        className="max-h-(--available-height) w-query-container max-w-2xl gap-0 overflow-hidden rounded-xl p-0"
      >
        <PopoverHeader className="shrink-0 flex-row items-center justify-between border-b border-border px-5 py-4">
          <PopoverTitle className="text-base">Filters</PopoverTitle>
          <ClearFiltersButton hasSelection={activeFilterCount > 0} onClear={onClear} />
        </PopoverHeader>
        <div className="@container min-h-0 space-y-5 overflow-y-auto overscroll-contain p-4 sm:p-5">
          <section className="space-y-3" aria-label="Genres">
            <h3 className="text-sm font-medium text-muted-foreground">Genres</h3>
            <GenreList genres={genres} selectedIds={selectedGenreIds} onToggle={onToggleGenre} />
          </section>
          <Separator />
          {keywordControls}
          <Separator />
          <section className="space-y-3" aria-label="More filters">
            <h3 className="text-sm font-medium text-muted-foreground">More filters</h3>
            <FilterControls
              includeSort
              mediaType={mediaType}
              watchProviders={watchProviders}
              userRegion={userRegion}
            />
          </section>
        </div>
        <div className="flex shrink-0 justify-end border-t border-border px-5 py-4">
          <Button className="h-10 w-full px-5 sm:w-auto" onClick={() => setOpen(false)}>
            Show results
          </Button>
        </div>
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
  keywords: Keyword[];
  onAddKeyword: (id: number) => void;
  onRemoveKeyword: (id: number) => void;
  mediaTypeControls: ReactNode;
};

function OrganizationControls({
  mediaType,
  chipsOnly = false,
}: {
  mediaType: 'movie' | 'tv';
  chipsOnly?: boolean;
}) {
  return (
    <div
      className={
        chipsOnly
          ? 'contents'
          : cn('grid w-full grid-cols-1 gap-5', mediaType === 'tv' && '@[30rem]:grid-cols-2')
      }
    >
      <OrganizationFilter kind="company" chipsOnly={chipsOnly} />
      {mediaType === 'tv' && <OrganizationFilter kind="network" chipsOnly={chipsOnly} />}
    </div>
  );
}

export function GenreNavigationClient({
  genres,
  mediaType,
  watchProviders,
  userRegion,
  activeFilterCount,
  portalContainer,
  onClearFilters,
  keywords,
  onAddKeyword,
  onRemoveKeyword,
  mediaTypeControls,
}: GenreNavigationClientProps) {
  const [urlState, setUrlState] = useQueryStates(
    {
      networkIds: parseAsArrayOf(parseAsInteger).withDefault([]),
      companyIds: parseAsArrayOf(parseAsInteger).withDefault([]),
      genreIds: parseAsArrayOf(parseAsInteger).withDefault([]),
      page: parseAsString.withDefault('1'),
    },
    {
      urlKeys: { genreIds: 'genreId', companyIds: 'companyId', networkIds: 'networkId' },
      history: 'push',
    },
  );

  const currentGenreIds = urlState.genreIds;
  const [pendingGenreSelection, setPendingGenreSelection] = useState<PendingGenreSelection | null>(
    null,
  );
  const selectedGenreIds = getOptimisticGenreIds(currentGenreIds, pendingGenreSelection);
  const networkIds = mediaType === 'tv' ? urlState.networkIds : [];
  const hasActiveChips = [
    selectedGenreIds.length,
    keywords.length,
    urlState.companyIds.length,
    networkIds.length,
  ].some(Boolean);
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
    <nav aria-label="Discover filters" className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="shrink-0">{mediaTypeControls}</div>
        <div className="ml-auto">
          <FilterDropdown
            genres={genres}
            mediaType={mediaType}
            watchProviders={watchProviders}
            userRegion={userRegion}
            activeFilterCount={totalActiveFilterCount}
            portalContainer={portalContainer}
            selectedGenreIds={selectedGenreIds}
            keywordControls={
              <>
                <DiscoverKeywords
                  keywords={keywords}
                  onAdd={onAddKeyword}
                  onRemove={onRemoveKeyword}
                />
                <Separator />
                <OrganizationControls mediaType={mediaType} />
              </>
            }
            onClear={handleClearAllFilters}
            onToggleGenre={handleGenreToggle}
          />
        </div>
        {totalActiveFilterCount > 0 && (
          <div className="hidden @[60rem]:block">
            <ClearFiltersButton hasSelection onClear={handleClearAllFilters} />
          </div>
        )}
        <div className="hidden @[60rem]:block">
          <SortByFilter mediaType={mediaType} controlId="discover-desktop-sort" compact />
        </div>
      </div>
      {hasActiveChips && (
        <div className="flex flex-wrap gap-2" aria-label="Active filters">
          <SelectedFilterChips
            items={genres.filter((genre) => selectedGenreIds.includes(genre.id))}
            kind="genre"
            onRemove={handleGenreToggle}
          />
          <SelectedFilterChips items={keywords} kind="keyword" onRemove={onRemoveKeyword} />
          <OrganizationControls mediaType={mediaType} chipsOnly />
        </div>
      )}
    </nav>
  );
}
