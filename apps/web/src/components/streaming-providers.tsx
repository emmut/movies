'use client';

import type { MovieWatchProviders } from '@movies/api/tmdb-types/movie';
import type { TvWatchProviders } from '@movies/api/tmdb-types/tv-show';
import type { RegionWatchProviders, WatchProvider } from '@movies/api/tmdb-types/watch-provider';
import { getRegionCodes, RegionCode } from '@movies/config/regions';
import { Play, ShoppingCart, TicketCheck, Tv, type LucideIcon } from 'lucide-react';
import Image from 'next/image';
import { parseAsStringLiteral, useQueryState } from 'nuqs';

import { RegionSelect } from '@/components/region-select';
import { formatImageUrl } from '@/lib/utils';

type StreamingProvidersProps = {
  watchProviders: MovieWatchProviders | TvWatchProviders;
  resourceId: number;
  resourceType: 'movie' | 'tv';
  userRegion: RegionCode;
};

function ProviderGroup({
  title,
  Icon,
  accent,
  providers,
  href,
}: {
  title: string;
  Icon: LucideIcon;
  accent: string;
  providers: WatchProvider[];
  href: string;
}) {
  if (providers.length === 0) {
    return null;
  }
  return (
    <div>
      <h3 className="mb-3 flex items-center gap-2 text-lg font-medium">
        <Icon className={'h-5 w-5 ' + accent} />
        {title}
      </h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {providers.map((provider) => (
          <a
            key={provider.provider_id}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-lg bg-zinc-800 p-3 transition-colors hover:bg-zinc-700"
          >
            <Image
              unoptimized
              src={formatImageUrl(provider.logo_path, 92)}
              alt={provider.provider_name}
              width={32}
              height={32}
              className="flex-shrink-0 rounded"
            />
            <span className="truncate text-sm font-medium">{provider.provider_name}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

function providerGroups(
  source: RegionWatchProviders | undefined,
  type: 'movie' | 'tv',
  id: number,
) {
  const data: Partial<RegionWatchProviders> = source ?? {};
  const fallback = 'https://www.themoviedb.org/' + type + '/' + id + '/watch';
  const href = data.link ?? fallback;
  const groups = [
    { kind: 'free' as const, title: 'Free', Icon: TicketCheck, accent: 'text-blue-500', href },
    { kind: 'flatrate' as const, title: 'Streaming', Icon: Tv, accent: 'text-green-500', href },
    { kind: 'rent' as const, title: 'Rent', Icon: Play, accent: 'text-blue-500', href },
    {
      kind: 'buy' as const,
      title: 'Buy',
      Icon: ShoppingCart,
      accent: 'text-orange-500',
      href: data.link || fallback,
    },
  ];
  return groups.map((group) => ({ ...group, providers: data[group.kind] ?? [] }));
}

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
  const [region] = useQueryState('region', parseAsStringLiteral(regions).withDefault(userRegion));

  const groups = providerGroups(watchProviders.results?.[region], resourceType, resourceId);
  const hasAnyServices = groups.some(
    (group) => group.kind !== 'free' && group.providers.length > 0,
  );

  return (
    <div>
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold">Where to watch</h2>
        <RegionSelect defaultValue={userRegion} allRegionProviders={watchProviders.results} />
      </div>

      <div className="space-y-6">
        {!hasAnyServices && (
          <div className="rounded-lg bg-zinc-800 p-6 text-center">
            <p className="text-zinc-400">No services available for this region</p>
          </div>
        )}

        {groups.map((group) => (
          <ProviderGroup key={group.kind} {...group} />
        ))}

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
