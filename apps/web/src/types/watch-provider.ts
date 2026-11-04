export type WatchProvider = {
  provider_id: number;
  provider_name: string;
  logo_path: string;
  display_priority: number;
};

export type RegionWatchProviders = {
  link: string;
  rent?: WatchProvider[];
  buy?: WatchProvider[];
  flatrate?: WatchProvider[];
  free?: WatchProvider[];
  ads?: WatchProvider[];
};

export type WatchOfferType = 'flatrate' | 'rent' | 'buy' | 'free' | 'ads';

export type DirectWatchLink = {
  providerId: number;
  regions?: string[];
  types: WatchOfferType[];
  url: string;
};

export type ResolvedWatchLink = DirectWatchLink & {
  source: 'popcorntime' | 'wikidata';
};

export type StreamingOfferType = WatchOfferType | 'cinema' | 'fast' | 'flatrate_and_buy' | 'other';

export type StreamingOffer = {
  providerId: string;
  providerName: string;
  via: string | null;
  logo: string | null;
  type: StreamingOfferType;
  url: string;
  source: 'popcorntime' | 'wikidata' | 'tmdb';
  availabilitySource: 'popcorntime' | 'tmdb';
};

export type PopcornTimeAvailability = {
  region: string;
  offers: StreamingOffer[];
};

export type ProviderWatchOptions = {
  directLinks: ResolvedWatchLink[];
  popcornTime: PopcornTimeAvailability | null;
};
