import { useNavigate } from '@tanstack/react-router';
import { ReactNode, Suspense } from 'react';

import DiscoverGrid from '@/components/discover-grid';
import FiltersPanel from '@/components/filters-panel';
import MediaTypeSelector from '@/components/media-type-selector';
import { WatchProvider } from '@movies/api/types/watch-provider';
import { Route } from '@/routes/discover/$';

type DiscoverContentProps = {
  filteredWatchProviders: WatchProvider[];
  userRegion: string;
  genreNavigation: ReactNode;
  userId?: string;
};

export function DiscoverContent({
  filteredWatchProviders,
  userRegion,
  genreNavigation,
  userId,
}: DiscoverContentProps) {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: '/discover/$' });

  const { page, mediaType, sort_by: sortBy, runtime, with_watch_providers, watch_region } = search;
  const selectedWatchProviders = with_watch_providers
    ?.split('|')
    .map(Number)
    .filter(Boolean) ?? [];
  const watchRegion = watch_region ?? userRegion;
  const runtimeLte = runtime ?? null;

  function updateSearch(updates: Partial<typeof search>) {
    navigate({
      search: (prev) => ({ ...prev, ...updates, page: updates.page ?? 1 }),
    });
  }

  return (
    <>
      <div className="relative mt-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-wrap gap-2">{genreNavigation}</div>
        <MediaTypeSelector currentMediaType={mediaType} />
      </div>

      <div className="mt-6">
        <FiltersPanel
          mediaType={mediaType}
          watchProviders={filteredWatchProviders}
          userRegion={watchRegion}
          sortBy={sortBy ?? 'popularity.desc'}
          runtimeLte={runtimeLte}
          selectedWatchProviders={selectedWatchProviders}
          onSortByChange={(value) => updateSearch({ sort_by: value })}
          onRuntimeChange={(value) =>
            updateSearch({ runtime: value ?? undefined })
          }
          onWatchProvidersChange={(providerIds) =>
            updateSearch({
              with_watch_providers:
                providerIds.length > 0 ? providerIds.join('|') : undefined,
              watch_region: providerIds.length > 0 ? userRegion : undefined,
            })
          }
        />
      </div>

      <div
        id="content-container"
        className="mt-7 grid scroll-m-5 grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5"
      >
        <Suspense>
          <DiscoverGrid
            currentGenreId={0}
            currentPage={page}
            mediaType={mediaType}
            sortBy={sortBy}
            watchProviders={with_watch_providers}
            watchRegion={watchRegion}
            runtimeLte={runtimeLte ?? undefined}
            userId={userId}
          />
        </Suspense>
      </div>
    </>
  );
}
