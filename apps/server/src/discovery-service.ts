import 'server-only';
import { buildDiscoverSearchParams } from '@movies/api/discover-params';
import type { DiscoveryService } from '@movies/api/router';
import type { TmdbFetch } from '@movies/api/tmdb-fetch';
import { tmdbImageUrl, toMediaCard } from '@server/media-card';
import { z } from 'zod';

const card = z.object({
  id: z.number().int().positive(),
  title: z.string().optional(),
  name: z.string().optional(),
  release_date: z.string().optional(),
  first_air_date: z.string().optional(),
  poster_path: z.string().nullable().default(null),
  backdrop_path: z.string().nullable().default(null),
  vote_average: z.number().default(0),
});
const pageSchema = z.object({
  results: z.array(card),
  total_pages: z.number().int().nonnegative(),
  total_results: z.number().int().nonnegative(),
});
const genreSchema = z.object({
  genres: z.array(z.object({ id: z.number().int().positive(), name: z.string() })),
});
const providerSchema = z.object({
  results: z.array(
    z.object({
      provider_id: z.number().int().positive(),
      provider_name: z.string(),
      logo_path: z.string().nullable(),
      display_priority: z.number().default(0),
    }),
  ),
});
const countrySchema = z.array(
  z.object({ iso_3166_1: z.string().regex(/^[A-Z]{2}$/), english_name: z.string() }),
);

export function createDiscoveryService(fetchTmdb: TmdbFetch): DiscoveryService {
  return {
    async list(input) {
      const data = pageSchema.parse(
        await fetchTmdb('/discover/' + input.type, {
          searchParams: buildDiscoverSearchParams({
            genreIds: input.genreIds,
            page: input.page,
            sortBy: input.sortBy,
            watchRegion: input.region,
            watchProviders: input.providerIds.join('|') || undefined,
            withRuntimeLte: input.runtime,
            withOriginCountry: input.originCountries.join('|') || undefined,
          }),
        }),
      );
      return {
        items: data.results.map((item) => toMediaCard(item, input.type)),
        totalPages: Math.min(500, data.total_pages),
        totalResults: data.total_results,
      };
    },
    async options({ type, region }) {
      const [genreData, providerData, countryData] = await Promise.all([
        fetchTmdb('/genre/' + type + '/list'),
        fetchTmdb('/watch/providers/' + type, { searchParams: { watch_region: region } }),
        fetchTmdb('/configuration/countries'),
      ]);
      return {
        genres: genreSchema.parse(genreData).genres,
        providers: providerSchema
          .parse(providerData)
          .results.sort((a, b) => a.display_priority - b.display_priority)
          .map((provider) => ({
            id: provider.provider_id,
            name: provider.provider_name,
            logoUrl: tmdbImageUrl(provider.logo_path, 'w92'),
          })),
        countries: countrySchema
          .parse(countryData)
          .map((country) => ({ code: country.iso_3166_1, name: country.english_name }))
          .sort((a, b) => a.name.localeCompare(b.name)),
      };
    },
  };
}
