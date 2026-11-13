import { WatchProvider } from '@movies/api/tmdb-types/watch-provider';
import { Button } from '@movies/ui/components/button';
import { useId } from 'react';

import OriginCountryFilter from './origin-country-filter';
import RuntimeFilter from './runtime-filter';
import SortByFilter from './sort-by-filter';
import WatchProviderFilter from './watch-provider-filter';

type FilterControlsBaseProps = {
  mediaType: 'movie' | 'tv';
  watchProviders: WatchProvider[];
  userRegion: string;
};

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
        <div className="@[60rem]/discover:hidden">
          <SortByFilter mediaType={mediaType} controlId={`${id}-sort`} compact={false} />
        </div>
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
