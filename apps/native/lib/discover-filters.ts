import type { DiscoveryInput, DiscoveryOptions } from '@movies/api/discover';
import { MOVIE_SORT_OPTIONS, TV_SORT_OPTIONS } from '@movies/api/discover-options';
import { regions } from '@movies/config/regions';

type Choice = { value: string; label: string };

export type Filter =
  | 'genreId'
  | 'sort_by'
  | 'runtime'
  | 'with_origin_country'
  | 'with_watch_providers'
  | 'watch_region';
export type FilterSpec = {
  title: string;
  options: Choice[];
  selected: string[];
  multiple: boolean;
};

const builders = {
  genreId(input: DiscoveryInput, data: DiscoveryOptions): FilterSpec {
    return {
      title: 'Genres',
      options: data.genres.map((item) => ({ value: String(item.id), label: item.name })),
      selected: input.genreIds.map(String),
      multiple: true,
    };
  },
  with_watch_providers(input: DiscoveryInput, data: DiscoveryOptions): FilterSpec {
    return {
      title: 'Watch Providers',
      options: data.providers.map((item) => ({ value: String(item.id), label: item.name })),
      selected: input.providerIds.map(String),
      multiple: true,
    };
  },
  with_origin_country(input: DiscoveryInput, data: DiscoveryOptions): FilterSpec {
    return {
      title: 'Origin Country',
      options: data.countries.map((item) => ({ value: item.code, label: item.name })),
      selected: input.originCountries,
      multiple: true,
    };
  },
  watch_region(input: DiscoveryInput, _data: DiscoveryOptions): FilterSpec {
    return {
      title: 'Watch Region',
      options: regions.map((item) => ({ value: item.code, label: item.name })),
      selected: [input.region],
      multiple: false,
    };
  },
  runtime(input: DiscoveryInput, _data: DiscoveryOptions): FilterSpec {
    return {
      title: 'Runtime',
      options: [0, 30, 60, 90, 120].map((value) => ({
        value: String(value),
        label: value ? 'Up to ' + value + ' min' : 'Any',
      })),
      selected: [String(input.runtime ?? 0)],
      multiple: false,
    };
  },
  sort_by(input: DiscoveryInput, _data: DiscoveryOptions): FilterSpec {
    return {
      title: 'Sort By',
      options: input.type === 'movie' ? MOVIE_SORT_OPTIONS : TV_SORT_OPTIONS,
      selected: [input.sortBy],
      multiple: false,
    };
  },
};

export function filterSpec(
  filter: Filter,
  input: DiscoveryInput,
  data: DiscoveryOptions,
): FilterSpec {
  return builders[filter](input, data);
}
