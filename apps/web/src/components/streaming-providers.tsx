'use client';

import { getRegionCodes, RegionCode } from '@movies/config/regions';
import { ExternalLink, Play, ShoppingCart, TicketCheck, Tv } from 'lucide-react';
import Image from 'next/image';
import { parseAsStringLiteral, useQueryState } from 'nuqs';

import { RegionSelect } from '@/components/region-select';
import { getStreamingOffers } from '@/lib/streaming-offers';
import { formatImageUrl } from '@/lib/utils';
import { getTmdbWatchUrl } from '@/lib/watch-links';
import type { MovieWatchProviders } from '@/types/movie';
import type { TvWatchProviders } from '@/types/tv-show';
import type {
  PopcornTimeAvailability,
  ResolvedWatchLink,
  StreamingOffer,
  StreamingOfferType,
} from '@/types/watch-provider';

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
  {
    type: 'flatrate_and_buy',
    title: 'Subscription or purchase',
    action: 'View options',
    Icon: Tv,
    color: 'text-green-500',
  },
  { type: 'fast', title: 'Live channels', action: 'Open', Icon: Tv, color: 'text-blue-500' },
  {
    type: 'cinema',
    title: 'Cinema',
    action: 'Get tickets',
    Icon: TicketCheck,
    color: 'text-orange-500',
  },
  {
    type: 'other',
    title: 'Other options',
    action: 'View options',
    Icon: ExternalLink,
    color: 'text-zinc-400',
  },
] satisfies {
  type: StreamingOfferType;
  title: string;
  action: string;
  Icon: typeof Tv;
  color: string;
}[];

type StreamingProvidersProps = {
  watchProviders: MovieWatchProviders | TvWatchProviders;
  directLinks: ResolvedWatchLink[] | undefined;
  popcornTime: PopcornTimeAvailability | null | undefined;
  resourceId: number;
  resourceType: 'movie' | 'tv';
  userRegion: RegionCode;
};

function ProviderCard({ offer, action }: { offer: StreamingOffer; action: string }) {
  const provider = offer.via ? `${offer.providerName} via ${offer.via}` : offer.providerName;
  const label = offer.source === 'tmdb' ? 'View options on TMDB' : `${action} on ${provider}`;
  return (
    <a
      href={offer.url}
      aria-label={`${label}${offer.source === 'tmdb' ? ` for ${provider}` : ''} (opens in a new tab)`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 rounded-lg bg-zinc-800 p-3 transition-colors hover:bg-zinc-700"
    >
      {offer.logo ? (
        <Image
          unoptimized
          src={offer.logo.startsWith('/') ? formatImageUrl(offer.logo, 92) : offer.logo}
          alt=""
          width={32}
          height={32}
          className="flex-shrink-0 rounded"
        />
      ) : (
        <Tv aria-hidden="true" className="h-8 w-8 shrink-0 text-zinc-400" />
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{provider}</span>
        <span className="block truncate text-xs text-zinc-400">{label}</span>
      </span>
      <ExternalLink aria-hidden="true" className="h-4 w-4 shrink-0 text-zinc-400" />
    </a>
  );
}

function SourceCredits({ offers, watchUrl }: { offers: StreamingOffer[]; watchUrl: string }) {
  const hasPopcorn = offers.some((offer) => offer.availabilitySource === 'popcorntime');
  const hasWikidata = offers.some((offer) => offer.source === 'wikidata');
  return (
    <div className="flex flex-wrap items-center gap-x-1 gap-y-2 text-xs text-zinc-400">
      <span>Availability:</span>
      {hasPopcorn && (
        <a
          href="https://popcorntime.app"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-white"
        >
          Popcorn Time
        </a>
      )}
      {hasPopcorn && <span>·</span>}
      <>
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
      </>
      {hasWikidata && (
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
  );
}

/** All Popcorn Time providers, with TMDB/Wikidata filling gaps in the selected country. */
export function StreamingProviders({
  watchProviders,
  directLinks = [],
  popcornTime,
  resourceId,
  resourceType,
  userRegion,
}: StreamingProvidersProps) {
  const regions = getRegionCodes();
  const [region] = useQueryState('region', parseAsStringLiteral(regions).withDefault(userRegion));
  const regionProviders = watchProviders.results?.[region];
  const watchUrl = getTmdbWatchUrl(resourceType, resourceId, region, regionProviders?.link);
  const offers = getStreamingOffers(popcornTime, regionProviders, directLinks, region, watchUrl);
  const groups = offerGroups.filter((group) => offers.some((offer) => offer.type === group.type));
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
              {offers
                .filter((offer) => offer.type === type)
                .map((offer) => (
                  <ProviderCard
                    key={`${offer.providerId}:${offer.url}`}
                    offer={offer}
                    action={action}
                  />
                ))}
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
        <SourceCredits offers={offers} watchUrl={watchUrl} />
      </div>
    </div>
  );
}
