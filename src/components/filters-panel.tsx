import {
  getUserRegion,
  getUserWatchProviders,
  getWatchProviders,
} from '@/lib/user-actions';
import SortByFilter from './sort-by-filter';
import WatchProviderFilter from './watch-provider-filter';

type FiltersPanelProps = {
  mediaType: 'movie' | 'tv';
  watchRegion: string;
};

/**
 * Renders a panel containing all available filters for movies or TV shows.
 *
 * Combines sorting, watch provider, and other filter options in a responsive layout.
 *
 * @param mediaType - Whether to show movie or TV filters.
 * @param watchProviders - Available watch providers for the user's region.
 * @param userRegion - The user's region code.
 */
export default async function FiltersPanel({
  mediaType,
  watchRegion,
}: FiltersPanelProps) {
  const userWatchProviders = await getUserWatchProviders();
  const userRegion = watchRegion ?? (await getUserRegion());

  const filteredWatchProviders = await getWatchProviders(
    watchRegion,
    userWatchProviders
  );
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <SortByFilter mediaType={mediaType} />
        <WatchProviderFilter
          providers={filteredWatchProviders}
          userRegion={userRegion}
        />
      </div>
    </div>
  );
}
