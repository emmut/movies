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

import {
  ClearFiltersButton,
  FilterControls,
  getFilterButtonLabel,
} from '@/components/filters-panel';
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
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={<Button variant="outline" />}
        aria-label={getFilterButtonLabel(activeFilterCount)}
        className={cn(
          'relative h-10 gap-2 px-4',
          activeFilterCount > 0 && 'border-primary/40 bg-primary/5',
        )}
      >
        <ListFilterIcon className="size-4" aria-hidden="true" />
        Filters
        {activeFilterCount > 0 && (
          <span
            data-slot="filter-count"
            aria-hidden="true"
            className="absolute -top-2 -right-2 flex size-5 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground tabular-nums ring-2 ring-background"
          >
            {activeFilterCount}
          </span>
        )}
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
          {keywordControls}
          <Separator />
          <section className="space-y-3" aria-label="Genres">
            <h3 className="text-sm font-medium text-muted-foreground">Genres</h3>
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
          <section className="space-y-3" aria-label="More filters">
            <h3 className="text-sm font-medium text-muted-foreground">More filters</h3>
            <FilterControls
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
  keywordControls: ReactNode;
};

export function GenreNavigationClient({
  genres,
  mediaType,
  watchProviders,
  userRegion,
  activeFilterCount,
  portalContainer,
  onClearFilters,
  keywordControls,
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
    <nav aria-label="Discover filters">
      <FilterDropdown
        genres={genres}
        mediaType={mediaType}
        watchProviders={watchProviders}
        userRegion={userRegion}
        activeFilterCount={totalActiveFilterCount}
        portalContainer={portalContainer}
        selectedGenreIds={selectedGenreIds}
        keywordControls={keywordControls}
        onClear={handleClearAllFilters}
        onToggleGenre={handleGenreToggle}
      />
    </nav>
  );
}
