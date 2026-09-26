import { type ReactNode } from 'react';

import { WatchProvider } from '@/types/watch-provider';

import OriginCountryFilter from './origin-country-filter';
import RuntimeFilter from './runtime-filter';
import SortByFilter from './sort-by-filter';
import { Button } from './ui/button';
import WatchProviderFilter from './watch-provider-filter';

type FilterControlsBaseProps = {
  mediaType: 'movie' | 'tv';
  watchProviders: WatchProvider[];
  userRegion: string;
};

type FiltersPanelProps = FilterControlsBaseProps & {
  hasActiveFilters: boolean;
  onClearFilters: () => Promise<URLSearchParams>;
};

type FilterControlsProps = FilterControlsBaseProps & {
  controlIdSuffix?: string;
  grouped?: boolean;
  trailingControl?: ReactNode;
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

export function CompactFilterControls({
  mediaType,
  watchProviders,
  userRegion,
}: FilterControlsBaseProps) {
  return (
    <div className="grid grid-cols-1 gap-4 @[30rem]:grid-cols-2">
      <FilterControls
        mediaType={mediaType}
        watchProviders={watchProviders}
        userRegion={userRegion}
        controlIdSuffix="compact"
      />
    </div>
  );
}

function FilterControls({
  mediaType,
  watchProviders,
  userRegion,
  controlIdSuffix,
  grouped = false,
  trailingControl,
}: FilterControlsProps) {
  const suffix = controlIdSuffix ? `-${controlIdSuffix}` : '';
  const sortByFilter = (
    <SortByFilter mediaType={mediaType} controlId={`select-sort-option${suffix}`} />
  );
  const runtimeFilter = <RuntimeFilter controlId={`runtime-filter${suffix}`} />;
  const originCountryFilter = <OriginCountryFilter controlId={`origin-country${suffix}`} />;
  const watchProviderFilter = (
    <WatchProviderFilter
      providers={watchProviders}
      userRegion={userRegion}
      controlId={`watch-providers${suffix}`}
    />
  );

  if (grouped) {
    return (
      <>
        {trailingControl ? (
          <div className="flex basis-full items-center justify-between">
            <h2 className="text-sm font-medium">More filters</h2>
            {trailingControl}
          </div>
        ) : null}
        <div className="flex items-end gap-4">
          {sortByFilter}
          {runtimeFilter}
        </div>
        <div className="flex items-end gap-4">
          {originCountryFilter}
          {watchProviderFilter}
        </div>
      </>
    );
  }

  return (
    <>
      {sortByFilter}
      {runtimeFilter}
      {originCountryFilter}
      {watchProviderFilter}
    </>
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

/**
 * Renders a panel containing all available filters for movies or TV shows.
 *
 * Combines sorting, watch provider, and other filter options in a responsive layout.
 *
 * @param mediaType - Whether to show movie or TV filters.
 * @param watchProviders - Available watch providers for the user's region.
 * @param userRegion - The user's region code.
 */
export default function FiltersPanel({
  mediaType,
  watchProviders,
  userRegion,
  hasActiveFilters,
  onClearFilters,
}: FiltersPanelProps) {
  function handleClearFilters() {
    void onClearFilters();
  }

  return (
    <div className="order-3 hidden basis-full flex-wrap items-end justify-between gap-x-4 gap-y-1 @[60rem]:flex">
      <FilterControls
        mediaType={mediaType}
        watchProviders={watchProviders}
        userRegion={userRegion}
        grouped
        trailingControl={
          <ClearFiltersButton hasSelection={hasActiveFilters} onClear={handleClearFilters} />
        }
      />
    </div>
  );
}
