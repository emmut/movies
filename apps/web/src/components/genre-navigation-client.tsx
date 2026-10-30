'use client';

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

import { DiscoverKeywords, KeywordSelection } from '@/components/discover-keywords';
import { DiscoverTagFilter } from '@/components/discover-tag-filter';
import {
  ClearFiltersButton,
  FilterCount,
  FilterControls,
  getFilterButtonLabel,
  MoreFilters,
} from '@/components/filters-panel';
import { useResponsivePopover } from '@/hooks/use-responsive-popover';
import type { Keyword } from '@/types/keyword';
import { WatchProvider } from '@/types/watch-provider';

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
  additionalFilterCount: number;
  portalContainer: RefObject<HTMLElement | null>;
  onClearFilters: () => Promise<URLSearchParams>;
  keywords: Keyword[];
  onAddKeyword: (id: number) => void;
  onRemoveKeyword: (id: number) => void;
  mediaTypeControls: ReactNode;
};

export function GenreNavigationClient({
  genres,
  mediaType,
  watchProviders,
  userRegion,
  activeFilterCount,
  additionalFilterCount,
  portalContainer,
  onClearFilters,
  keywords,
  onAddKeyword,
  onRemoveKeyword,
  mediaTypeControls,
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
    <nav aria-label="Discover filters" className="space-y-5">
      <div className="hidden @[60rem]:block">
        <GenreList genres={genres} selectedIds={selectedGenreIds} onToggle={handleGenreToggle} />
      </div>
      <div className="flex items-start justify-between gap-4">
        <div className="@[60rem]:hidden">
          <FilterDropdown
            genres={genres}
            mediaType={mediaType}
            watchProviders={watchProviders}
            userRegion={userRegion}
            activeFilterCount={totalActiveFilterCount}
            portalContainer={portalContainer}
            selectedGenreIds={selectedGenreIds}
            keywordControls={
              <DiscoverKeywords
                keywords={keywords}
                onAdd={onAddKeyword}
                onRemove={onRemoveKeyword}
              />
            }
            onClear={handleClearAllFilters}
            onToggleGenre={handleGenreToggle}
          />
        </div>
        <div className="hidden min-w-0 flex-1 flex-wrap items-center gap-3 @[60rem]:flex">
          <DiscoverTagFilter
            selectedIds={keywords.map((keyword) => keyword.id)}
            onSelect={onAddKeyword}
          />
          <KeywordSelection keywords={keywords} onRemove={onRemoveKeyword} />
        </div>
        <div className="ml-auto shrink-0 @[60rem]:hidden">{mediaTypeControls}</div>
      </div>
      <div className="hidden items-end justify-between gap-4 border-t border-border pt-4 @[60rem]:flex">
        <div className="flex items-end gap-3">
          <SortByFilter mediaType={mediaType} controlId="discover-desktop-sort" />
          <MoreFilters
            mediaType={mediaType}
            watchProviders={watchProviders}
            userRegion={userRegion}
            activeCount={additionalFilterCount}
          />
          {totalActiveFilterCount > 0 && (
            <ClearFiltersButton hasSelection onClear={handleClearAllFilters} />
          )}
        </div>
        <div className="shrink-0">{mediaTypeControls}</div>
      </div>
    </nav>
  );
}
