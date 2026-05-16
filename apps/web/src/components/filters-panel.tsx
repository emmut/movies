import { WatchProvider } from '@movies/api/types/watch-provider';

import RuntimeFilter from './runtime-filter';
import SortByFilter from './sort-by-filter';
import WatchProviderFilter from './watch-provider-filter';

type FiltersPanelProps = {
  mediaType: 'movie' | 'tv';
  watchProviders: WatchProvider[];
  userRegion: string;
  sortBy: string;
  runtimeLte: number | null;
  selectedWatchProviders: number[];
  onSortByChange: (value: string) => void;
  onRuntimeChange: (value: number | null) => void;
  onWatchProvidersChange: (providerIds: number[]) => void;
};

export default function FiltersPanel({
  mediaType,
  watchProviders,
  userRegion,
  sortBy,
  runtimeLte,
  selectedWatchProviders,
  onSortByChange,
  onRuntimeChange,
  onWatchProvidersChange,
}: FiltersPanelProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <SortByFilter mediaType={mediaType} value={sortBy} onChange={onSortByChange} />
        <RuntimeFilter
          className="md:mr-auto"
          value={runtimeLte}
          onChange={onRuntimeChange}
        />
        <WatchProviderFilter
          providers={watchProviders}
          selectedProviders={selectedWatchProviders}
          userRegion={userRegion}
          onChange={onWatchProvidersChange}
        />
      </div>
    </div>
  );
}
