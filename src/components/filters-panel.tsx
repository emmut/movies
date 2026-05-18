import { ReactNode } from 'react';

import { WatchProvider } from '@/types/watch-provider';

import RuntimeFilter from './runtime-filter';
import SortByFilter from './sort-by-filter';
import WatchProviderFilter from './watch-provider-filter';

type FiltersPanelProps = {
  mediaType: 'movie' | 'tv';
  watchProviders: WatchProvider[];
  userRegion: string;
  genreFilter?: ReactNode;
};

/**
 * Renders a panel containing all available filters for movies or TV shows.
 *
 * Combines sorting, watch provider, and other filter options in a responsive layout.
 *
 * @param mediaType - Whether to show movie or TV filters.
 * @param watchProviders - Available watch providers for the user's region.
 * @param userRegion - The user's region code.
 * @param genreFilter - Server-rendered genre dropdown slot.
 */
export default function FiltersPanel({
  mediaType,
  watchProviders,
  userRegion,
  genreFilter,
}: FiltersPanelProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        {genreFilter}
        <SortByFilter mediaType={mediaType} />
        <RuntimeFilter className="md:mr-auto" />
        <WatchProviderFilter providers={watchProviders} userRegion={userRegion} />
      </div>
    </div>
  );
}
