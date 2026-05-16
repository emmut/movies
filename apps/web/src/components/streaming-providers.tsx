import { useState } from 'react';
import { Play, ShoppingCart, TicketCheck, Tv } from 'lucide-react';

import { RegionSelect } from '@/components/region-select';
import { RegionCode } from '@movies/media';
import { formatImageUrl } from '@movies/ui/lib/utils';
import type { MovieWatchProviders } from '@movies/api/types/movie';
import type { TvWatchProviders } from '@movies/api/types/tv-show';

type StreamingProvidersProps = {
  watchProviders: MovieWatchProviders | TvWatchProviders;
  resourceId: number;
  resourceType: 'movie' | 'tv';
  userRegion: RegionCode;
};

export function StreamingProviders({
  watchProviders,
  resourceId,
  resourceType,
  userRegion,
}: StreamingProvidersProps) {
  const [region, setRegion] = useState<RegionCode>(userRegion);

  const regionProviders = watchProviders.results?.[region];
  const allRegionProviders = watchProviders.results as Record<RegionCode, import('@movies/api/types/watch-provider').RegionWatchProviders>;
  const streamingServices = regionProviders?.flatrate || [];
  const rentalServices = regionProviders?.rent || [];
  const purchaseServices = regionProviders?.buy || [];
  const freeServices = regionProviders?.free || [];

  const hasAnyServices =
    streamingServices.length > 0 || rentalServices.length > 0 || purchaseServices.length > 0;

  function getDefaultWatchUrl() {
    return `https://www.themoviedb.org/${resourceType}/${resourceId}/watch`;
  }

  function ProviderImage({ logoPath, name }: { logoPath: string; name: string }) {
    return (
      <img
        src={formatImageUrl(logoPath, 92)}
        alt={name}
        width={32}
        height={32}
        className="flex-shrink-0 rounded"
      />
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold">Where to watch</h2>
        <RegionSelect
          allRegionProviders={allRegionProviders}
          value={region}
          onChange={setRegion}
        />
      </div>

      <div className="space-y-6">
        {!hasAnyServices && (
          <div className="rounded-lg bg-zinc-800 p-6 text-center">
            <p className="text-zinc-400">No services available for this region</p>
          </div>
        )}

        {freeServices.length > 0 && (
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-lg font-medium">
              <TicketCheck className="h-5 w-5 text-blue-500" />
              Free
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {freeServices.map((provider) => (
                <a
                  key={provider.provider_id}
                  href={regionProviders?.link ?? getDefaultWatchUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-lg bg-zinc-800 p-3 transition-colors hover:bg-zinc-700"
                >
                  <ProviderImage logoPath={provider.logo_path} name={provider.provider_name} />
                  <span className="truncate text-sm font-medium">{provider.provider_name}</span>
                </a>
              ))}
            </div>
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
                  href={regionProviders?.link ?? getDefaultWatchUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-lg bg-zinc-800 p-3 transition-colors hover:bg-zinc-700"
                >
                  <ProviderImage logoPath={provider.logo_path} name={provider.provider_name} />
                  <span className="truncate text-sm font-medium">{provider.provider_name}</span>
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
                  href={regionProviders?.link ?? getDefaultWatchUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-lg bg-zinc-800 p-3 transition-colors hover:bg-zinc-700"
                >
                  <ProviderImage logoPath={provider.logo_path} name={provider.provider_name} />
                  <span className="truncate text-sm font-medium">{provider.provider_name}</span>
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
                  <ProviderImage logoPath={provider.logo_path} name={provider.provider_name} />
                  <span className="truncate text-sm font-medium">{provider.provider_name}</span>
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
