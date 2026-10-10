import 'server-only';
import type { CatalogDetailInput } from '@movies/api/catalog';
import {
  pickYoutubeTrailer,
  type CatalogRelatedInput,
  type CatalogTitleInput,
} from '@movies/api/catalog-support';
import type { CatalogService } from '@movies/api/router';
import type { TmdbFetch } from '@movies/api/tmdb-fetch';
import { z } from 'zod';

import { tmdbImageUrl, toMediaCard } from './media-card';

const videosSchema = z.object({
  results: z.array(z.object({ key: z.string(), site: z.string(), type: z.string() })),
});
const providerSchema = z.object({
  provider_id: z.number().int().positive(),
  provider_name: z.string(),
  logo_path: z.string().nullable(),
});
const regionProvidersSchema = z.object({
  link: z.string().optional(),
  free: z.array(providerSchema).default([]),
  flatrate: z.array(providerSchema).default([]),
  rent: z.array(providerSchema).default([]),
  buy: z.array(providerSchema).default([]),
});
const providersSchema = z.object({ results: z.record(z.string(), regionProvidersSchema) });
const cardsSchema = z.object({
  results: z.array(
    z.object({
      id: z.number().int().positive(),
      title: z.string().optional(),
      name: z.string().optional(),
      release_date: z.string().optional(),
      first_air_date: z.string().optional(),
      poster_path: z.string().nullable().default(null),
      backdrop_path: z.string().nullable().default(null),
      vote_average: z.number().default(0),
    }),
  ),
});

function watchLink(link: string | undefined, { id, type }: CatalogDetailInput) {
  if (link) {
    try {
      const url = new URL(link);
      if (url.protocol === 'https:' || url.protocol === 'http:') return url.href;
    } catch {
      // Missing/invalid upstream links use TMDB's documented watch page.
    }
  }
  return `https://www.themoviedb.org/${type}/${id}/watch`;
}
function providerCard(item: z.infer<typeof providerSchema>) {
  return {
    id: item.provider_id,
    name: item.provider_name,
    logoUrl: tmdbImageUrl(item.logo_path, 'w92'),
  };
}

export function createCatalogSupportService(
  fetchTmdb: TmdbFetch,
): Pick<CatalogService, 'trailer' | 'providers' | 'related'> {
  return {
    async trailer({ id, type }: CatalogTitleInput) {
      const data = videosSchema.parse(await fetchTmdb<unknown>(`/${type}/${id}/videos`));
      const key = pickYoutubeTrailer(data.results);
      return key ? { key } : null;
    },
    async providers(input: CatalogDetailInput) {
      const data = providersSchema.parse(
        await fetchTmdb<unknown>(`/${input.type}/${input.id}/watch/providers`),
      );
      const selected = data.results[input.region];
      const groups = regionProvidersSchema.parse(selected ?? {});
      return {
        link: watchLink(groups.link, input),
        free: groups.free.map(providerCard),
        streaming: groups.flatrate.map(providerCard),
        rent: groups.rent.map(providerCard),
        buy: groups.buy.map(providerCard),
      };
    },
    async related({ id, type, region, kind }: CatalogRelatedInput) {
      const data = cardsSchema.parse(
        await fetchTmdb<unknown>(`/${type}/${id}/${kind}`, { searchParams: { region } }),
      );
      return data.results.map((item) => toMediaCard(item, type));
    },
  };
}
