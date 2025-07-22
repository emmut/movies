'use client';

import { RegionSelect } from '@/components/region-select';
import { getRegionCodes, RegionCode } from '@/lib/regions';
import { formatImageUrl } from '@/lib/utils';
import type { MovieWatchProviders } from '@/types/movie';
import type { TvWatchProviders } from '@/types/tv-show';
import { Play, ShoppingCart, Tv } from 'lucide-react';
import Image from 'next/image';
import { parseAsStringLiteral, useQueryState } from 'nuqs';

type StreamingProvidersProps = {
  watchProviders: MovieWatchProviders | TvWatchProviders;
  resourceId: number;
  resourceType: 'movie' | 'tv';
  userRegion: RegionCode;
};

/**
 * Displays available streaming, rental, and purchase providers for a movie or TV show by region.
 *
 * Renders provider options based on the selected or default region, allowing users to view where a specific movie or TV show can be streamed, rented, or purchased. If no providers are available for the chosen region, a fallback message is shown.
 *
 * @param watchProviders - Watch provider data for the resource, organized by region.
 * @param resourceId - The TMDB ID of the movie or TV show.
 * @param resourceType - The type of resource, either 'movie' or 'tv'.
 * @param userRegion - The user's default region code.
 *
 * @remark
 * Provider links open in a new tab and default to the TMDB watch page if a region-specific link is unavailable.
 */
export function StreamingProviders({
  watchProviders,
  resourceId,
  resourceType,
  userRegion,
}: StreamingProvidersProps) {
  const regions = getRegionCodes();
  const [region] = useQueryState(
    'region',
    parseAsStringLiteral(regions).withDefault(userRegion)
  );

  const regionProviders = watchProviders.results?.[region];
  const allRegionProviders = watchProviders.results;
  const streamingServices = regionProviders?.flatrate || [];
  const rentalServices = regionProviders?.rent || [];
  const purchaseServices = regionProviders?.buy || [];

  const hasAnyServices =
    streamingServices.length > 0 ||
    rentalServices.length > 0 ||
    purchaseServices.length > 0;

  const getDefaultWatchUrl = () => {
    return `https://www.themoviedb.org/${resourceType}/${resourceId}/watch`;
  };

  return (
    <div>
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold">Where to watch</h2>
        <RegionSelect
          defaultValue={userRegion}
          allRegionProviders={allRegionProviders}
        />
      </div>

      <div className="space-y-6">
        {!hasAnyServices && (
          <div className="rounded-lg bg-zinc-800 p-6 text-center">
            <p className="text-zinc-400">
              No services available for this region
            </p>
          </div>
        )}

        {streamingServices.length > 0 && (
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-lg font-medium">
              <Tv className="h-5 w-5 text-green-500" />
              Streaming
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {streamingServices.map((provider) => (
                <a
                  key={provider.provider_id}
                  href={regionProviders?.link || getDefaultWatchUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-lg bg-zinc-800 p-3 transition-colors hover:bg-zinc-700"
                >
                  <Image
                    src={formatImageUrl(provider.logo_path, 92)}
                    alt={provider.provider_name}
                    width={32}
                    height={32}
                    className="flex-shrink-0 rounded"
                  />
                  <span className="truncate text-sm font-medium">
                    {provider.provider_name}
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}

        {rentalServices.length > 0 && (
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-lg font-medium">
              <Play className="h-5 w-5 text-blue-500" />
              Rent
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {rentalServices.map((provider) => (
                <a
                  key={provider.provider_id}
                  href={regionProviders?.link || getDefaultWatchUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-lg bg-zinc-800 p-3 transition-colors hover:bg-zinc-700"
                >
                  <Image
                    src={formatImageUrl(provider.logo_path, 92)}
                    alt={provider.provider_name}
                    width={32}
                    height={32}
                    className="flex-shrink-0 rounded"
                  />
                  <span className="truncate text-sm font-medium">
                    {provider.provider_name}
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}

        {purchaseServices.length > 0 && (
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-lg font-medium">
              <ShoppingCart className="h-5 w-5 text-orange-500" />
              Buy
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {purchaseServices.map((provider) => (
                <a
                  key={provider.provider_id}
                  href={regionProviders?.link || getDefaultWatchUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-lg bg-zinc-800 p-3 transition-colors hover:bg-zinc-700"
                >
                  <Image
                    src={formatImageUrl(provider.logo_path, 92)}
                    alt={provider.provider_name}
                    width={32}
                    height={32}
                    className="flex-shrink-0 rounded"
                  />
                  <span className="truncate text-sm font-medium">
                    {provider.provider_name}
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-center gap-2 rounded-lg bg-zinc-800/50 p-3 text-center text-sm text-zinc-400 sm:justify-start">
          <span>Powered by</span>
          <a
            href="https://www.justwatch.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-zinc-300 underline transition-colors hover:text-white"
          >
            JustWatch
          </a>
          <span>via</span>
          <a
            href="https://www.themoviedb.org"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-zinc-300 underline transition-colors hover:text-white"
          >
            TMDB API
          </a>
        </div>
      </div>
    </div>
  );
}
