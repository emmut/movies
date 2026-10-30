import { Button } from '@movies/ui/components/button';
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@movies/ui/components/popover';
import { cn } from 'cn';
import { ListFilterIcon } from 'lucide-react';
import { useId } from 'react';

import { useResponsivePopover } from '@/hooks/use-responsive-popover';
import { WatchProvider } from '@/types/watch-provider';

import OriginCountryFilter from './origin-country-filter';
import RuntimeFilter from './runtime-filter';
import SortByFilter from './sort-by-filter';
import WatchProviderFilter from './watch-provider-filter';

type FilterControlsBaseProps = {
  mediaType: 'movie' | 'tv';
  watchProviders: WatchProvider[];
  userRegion: string;
};

type ActiveFilterState = {
  sortBy: string;
  runtimeLte: number | null;
  originCountries: string[];
  watchProviders: number[] | null;
};

export function getAdditionalFilterCount({
  runtimeLte,
  originCountries,
  watchProviders,
}: Omit<ActiveFilterState, 'sortBy'>) {
  return (
    Number((runtimeLte ?? 0) > 0) +
    Number(originCountries.length > 0) +
    Number((watchProviders?.length ?? 0) > 0)
  );
}

export function getActiveFilterCount(state: ActiveFilterState) {
  return Number(state.sortBy !== 'popularity.desc') + getAdditionalFilterCount(state);
}

export function getFilterButtonLabel(activeFilterCount: number) {
  return activeFilterCount === 0 ? 'Filters' : `Filters (${activeFilterCount})`;
}

export function FilterControls({
  mediaType,
  watchProviders,
  userRegion,
  includeSort,
}: FilterControlsBaseProps & { includeSort: boolean }) {
  const id = useId();
  return (
    <div className="grid grid-cols-1 gap-4 @[30rem]:grid-cols-2">
      {includeSort && (
        <SortByFilter mediaType={mediaType} controlId={`${id}-sort`} compact={false} />
      )}
      <RuntimeFilter controlId={`${id}-runtime`} />
      <OriginCountryFilter controlId={`${id}-country`} />
      <WatchProviderFilter
        providers={watchProviders}
        userRegion={userRegion}
        controlId={`${id}-providers`}
      />
    </div>
  );
}

type ClearFiltersButtonProps = {
  hasSelection: boolean;
  onClear: () => void;
};

export function ClearFiltersButton({ hasSelection, onClear }: ClearFiltersButtonProps) {
  return (
    <Button variant="ghost" size="sm" disabled={!hasSelection} onClick={onClear}>
      Clear all
    </Button>
  );
}

export function FilterCount({ count }: { count: number }) {
  if (count === 0) {
    return null;
  }
  return (
    <span
      data-slot="filter-count"
      aria-hidden="true"
      className="absolute -top-2 -right-2 flex size-5 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground tabular-nums ring-2 ring-background"
    >
      {count}
    </span>
  );
}

export function AdditionalFilters({
  mediaType,
  watchProviders,
  userRegion,
  activeCount,
}: FilterControlsBaseProps & { activeCount: number }) {
  const { open, setOpen, triggerRef } = useResponsivePopover();
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        ref={triggerRef}
        render={<Button variant="outline" />}
        aria-label={getFilterButtonLabel(activeCount)}
        className={cn(
          'relative h-10 gap-2 px-4',
          activeCount > 0 && 'border-primary/40 bg-primary/5',
        )}
      >
        <ListFilterIcon className="size-4" aria-hidden="true" />
        Filters
        <FilterCount count={activeCount} />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={12}
        className="@container max-h-(--available-height) w-80 max-w-(--available-width) gap-5 overflow-y-auto p-5"
      >
        <PopoverHeader>
          <PopoverTitle>Filters</PopoverTitle>
        </PopoverHeader>
        <FilterControls
          includeSort={false}
          mediaType={mediaType}
          watchProviders={watchProviders}
          userRegion={userRegion}
        />
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setOpen(false)}>
            Show results
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
