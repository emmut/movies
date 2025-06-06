'use client';

import { RegionSelect } from '@/components/region-select';
import { getRegionCodes, RegionCode } from '@/lib/regions';
import { formatImageUrl } from '@/lib/utils';
import type { MovieWatchProviders } from '@/types/Movie';
import { Play, ShoppingCart, Tv } from 'lucide-react';
import Image from 'next/image';
import { parseAsStringLiteral, useQueryState } from 'nuqs';

type StreamingProvidersProps = {
  watchProviders: MovieWatchProviders;
  movieId: number;
  userRegion: RegionCode;
};

export function StreamingProviders({
  watchProviders,
  movieId,
  userRegion,
}: StreamingProvidersProps) {
  const regions = getRegionCodes();
  const [region] = useQueryState(
    'region',
    parseAsStringLiteral(regions).withDefault(userRegion)
  );

  const regionProviders = watchProviders.results?.[region];
  const streamingServices = regionProviders?.flatrate || [];
  const rentalServices = regionProviders?.rent || [];
  const purchaseServices = regionProviders?.buy || [];

  const hasAnyServices =
    streamingServices.length > 0 ||
    rentalServices.length > 0 ||
    purchaseServices.length > 0;

  if (!hasAnyServices) {
    return (
      <div>
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold">Var kan du titta</h2>
          <RegionSelect defaultValue={userRegion} />
        </div>
        <div className="rounded-lg bg-zinc-800 p-6 text-center">
          <p className="text-zinc-400">
            No streaming services available for this region
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold">Var kan du titta</h2>
        <RegionSelect defaultValue={userRegion} />
      </div>

      <div className="space-y-6">
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
                  href={
                    regionProviders?.link ||
                    `https://www.themoviedb.org/movie/${movieId}/watch`
                  }
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
              Hyra
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {rentalServices.map((provider) => (
                <a
                  key={provider.provider_id}
                  href={
                    regionProviders?.link ||
                    `https://www.themoviedb.org/movie/${movieId}/watch`
                  }
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
              Köpa
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {purchaseServices.map((provider) => (
                <a
                  key={provider.provider_id}
                  href={
                    regionProviders?.link ||
                    `https://www.themoviedb.org/movie/${movieId}/watch`
                  }
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

        <div className="text-center text-xs text-zinc-500 sm:text-left">
          Data tillhandahålls av JustWatch
        </div>
      </div>
    </div>
  );
}
