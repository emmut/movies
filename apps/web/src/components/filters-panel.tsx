import { Button } from '@movies/ui/components/button';
import { cn } from 'cn';
import { useId } from 'react';

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

export function getActiveFilterCount({
  sortBy,
  runtimeLte,
  originCountries,
  watchProviders,
}: ActiveFilterState) {
  return (
    Number(sortBy !== 'popularity.desc') +
    Number((runtimeLte ?? 0) > 0) +
    Number(originCountries.length > 0) +
    Number((watchProviders?.length ?? 0) > 0)
  );
}

export function getFilterButtonLabel(activeFilterCount: number) {
  return activeFilterCount === 0 ? 'Filters' : `Filters (${activeFilterCount})`;
}

export function FilterControls({
  mediaType,
  watchProviders,
  userRegion,
  layout,
}: FilterControlsBaseProps & { layout: 'panel' | 'toolbar' }) {
  const id = useId();
  return (
    <div
      className={cn(
        'grid gap-4',
        layout === 'toolbar' ? 'grid-cols-4' : 'grid-cols-1 @[30rem]:grid-cols-2',
      )}
    >
      <SortByFilter mediaType={mediaType} controlId={`${id}-sort`} />
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
