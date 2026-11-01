'use client';

import { getRegionCodes, RegionCode } from '@movies/config/regions';
import { ExternalLink, Play, ShoppingCart, TicketCheck, Tv } from 'lucide-react';
import Image from 'next/image';
import { parseAsStringLiteral, useQueryState } from 'nuqs';

import { RegionSelect } from '@/components/region-select';
import { formatImageUrl } from '@/lib/utils';
import { getDirectWatchUrl, getTmdbWatchUrl } from '@/lib/watch-links';
import type { MovieWatchProviders } from '@/types/movie';
import type { TvWatchProviders } from '@/types/tv-show';
import type { DirectWatchLink, WatchOfferType } from '@/types/watch-provider';

const offerGroups = [
  { type: 'free', title: 'Free', action: 'Watch', Icon: TicketCheck, color: 'text-blue-500' },
  {
    type: 'ads',
    title: 'Free with ads',
    action: 'Watch',
    Icon: TicketCheck,
    color: 'text-blue-500',
  },
  { type: 'flatrate', title: 'Streaming', action: 'Watch', Icon: Tv, color: 'text-green-500' },
  { type: 'rent', title: 'Rent', action: 'Rent', Icon: Play, color: 'text-blue-500' },
  { type: 'buy', title: 'Buy', action: 'Buy', Icon: ShoppingCart, color: 'text-orange-500' },
] satisfies {
  type: WatchOfferType;
  title: string;
  action: string;
  Icon: typeof Tv;
  color: string;
}[];

type StreamingProvidersProps = {
  watchProviders: MovieWatchProviders | TvWatchProviders;
  directLinks?: DirectWatchLink[];
  resourceId: number;
  resourceType: 'movie' | 'tv';
  userRegion: RegionCode;
};

/** Regional availability with title-specific provider links and an explicit TMDB fallback. */
export function StreamingProviders({
  watchProviders,
  directLinks = [],
  resourceId,
  resourceType,
  userRegion,
}: StreamingProvidersProps) {
  const regions = getRegionCodes();
  const [region] = useQueryState('region', parseAsStringLiteral(regions).withDefault(userRegion));
  const regionProviders = watchProviders.results?.[region];
  const watchUrl = getTmdbWatchUrl(resourceType, resourceId, region, regionProviders?.link);
  const groups = offerGroups.filter((group) => (regionProviders?.[group.type]?.length ?? 0) > 0);
  const hasDirectLinks = groups.some((group) =>
    regionProviders?.[group.type]?.some((provider) =>
      getDirectWatchUrl(directLinks, provider.provider_id, region, group.type),
    ),
  );

  return (
    <div>
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold">Where to watch</h2>
        <RegionSelect defaultValue={userRegion} allRegionProviders={watchProviders.results} />
      </div>

      <div className="space-y-6">
        {groups.length === 0 && (
          <div className="rounded-lg bg-zinc-800 p-6 text-center">
            <p className="text-zinc-400">No services available for this region</p>
          </div>
        )}

        {groups.map(({ type, title, action, Icon, color }) => (
          <div key={type}>
            <h3 className="mb-3 flex items-center gap-2 text-lg font-medium">
              <Icon className={`h-5 w-5 ${color}`} />
              {title}
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {regionProviders?.[type]?.map((provider) => {
                const directUrl = getDirectWatchUrl(
                  directLinks,
                  provider.provider_id,
                  region,
                  type,
                );
                const label = directUrl
                  ? `${action} on ${provider.provider_name}`
                  : 'View options on TMDB';
                return (
                  <a
                    key={provider.provider_id}
                    href={directUrl ?? watchUrl}
                    aria-label={`${label}${directUrl ? '' : ` for ${provider.provider_name}`} (opens in a new tab)`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-lg bg-zinc-800 p-3 transition-colors hover:bg-zinc-700"
                  >
                    <Image
                      unoptimized
                      src={formatImageUrl(provider.logo_path, 92)}
                      alt=""
                      width={32}
                      height={32}
                      className="flex-shrink-0 rounded"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {provider.provider_name}
                      </span>
                      <span className="block truncate text-xs text-zinc-400">{label}</span>
                    </span>
                    <ExternalLink aria-hidden="true" className="h-4 w-4 shrink-0 text-zinc-400" />
                  </a>
                );
              })}
            </div>
          </div>
        ))}

        <a
          href={watchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-zinc-400 underline hover:text-white"
        >
          View all watch options on TMDB
          <ExternalLink aria-hidden="true" className="h-3 w-3" />
        </a>
        <div className="flex flex-wrap items-center gap-x-1 gap-y-2 text-xs text-zinc-400">
          <span>Availability:</span>
          <a
            href="https://www.justwatch.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-white"
          >
            JustWatch
          </a>
          <span>via</span>
          <a
            href={watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-white"
          >
            TMDB
          </a>
          {hasDirectLinks && (
            <>
              <span>· Links:</span>
              <a
                href="https://www.wikidata.org"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-white"
              >
                Wikidata
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
