import { Button } from '@movies/ui/components/button';

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

export function FilterControls({ mediaType, watchProviders, userRegion }: FilterControlsBaseProps) {
  return (
    <div className="grid grid-cols-1 gap-4 @[30rem]:grid-cols-2">
      <SortByFilter mediaType={mediaType} />
      <RuntimeFilter />
      <OriginCountryFilter />
      <WatchProviderFilter providers={watchProviders} userRegion={userRegion} />
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
