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
  source: 'wikidata' | 'popcorntime';
  providerId: number;
  regions?: string[];
  types: WatchOfferType[];
  url: string;
};
