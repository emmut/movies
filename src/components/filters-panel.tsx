import SortByFilter from './sort-by-filter';
import WatchProviderFilter from './watch-provider-filter';

type FiltersPanelProps = {
  mediaType: 'movie' | 'tv';
};

/**
 * Renders a panel containing all available filters for movies or TV shows.
 *
 * Combines sorting, watch provider, and other filter options in a responsive layout.
 *
 * @param mediaType - Whether to show movie or TV filters.
 */
export default function FiltersPanel({ mediaType }: FiltersPanelProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <SortByFilter mediaType={mediaType} />
        </div>
        <div className="sm:w-auto">
          <WatchProviderFilter />
        </div>
      </div>
    </div>
  );
}
