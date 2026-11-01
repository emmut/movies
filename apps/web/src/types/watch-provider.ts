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

export type DirectWatchOffer = {
  providerName: string;
  region: string;
  type: WatchOfferType;
  url: string;
};
