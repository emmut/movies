import 'server-only';
import type { CatalogDetail, CatalogDetailInput } from '@movies/api/catalog';
import {
  pickMovieCertification,
  pickTvCertification,
  type MovieReleaseDatesResponse,
  type TvContentRatingsResponse,
} from '@movies/api/certifications';
import type { CatalogService } from '@movies/api/router';
import { TmdbRequestError, type TmdbFetch } from '@movies/api/tmdb-fetch';
import { ORPCError } from '@orpc/server';
import { z } from 'zod';

import { createCatalogSupportService } from './catalog-support-service';
import { tmdbImageUrl } from './media-card';

const text = z
  .string()
  .nullish()
  .transform((value) => value ?? '');
const detailsSchema = z.object({
  id: z.number().int().positive(),
  title: text,
  name: text,
  poster_path: text,
  backdrop_path: text,
  release_date: text,
  first_air_date: text,
  overview: text,
  tagline: text,
  genres: z.array(z.object({ id: z.number().int().positive(), name: z.string() })).default([]),
  vote_average: z.number().default(0),
  vote_count: z.number().int().nonnegative().default(0),
  popularity: z.number().nonnegative().default(0),
  original_title: text,
  original_name: text,
  status: text,
  spoken_languages: z.array(z.object({ english_name: z.string() })).default([]),
  origin_country: z.array(z.string()).default([]),
  homepage: text,
  runtime: z.number().int().nonnegative().nullish(),
  budget: z.number().nonnegative().default(0),
  revenue: z.number().nonnegative().default(0),
  number_of_seasons: z.number().int().nonnegative().default(0),
  number_of_episodes: z.number().int().nonnegative().default(0),
  episode_run_time: z.array(z.number().int().nonnegative()).default([]),
  last_air_date: text,
  networks: z.array(z.object({ name: z.string() })).default([]),
});

function publicHomepage(value: string) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol === 'https:' || url.protocol === 'http:') return url.href;
  } catch {
    // Optional upstream homepage metadata may not be a usable URL.
  }
  return null;
}

async function certification(fetchTmdb: TmdbFetch, { id, type, region }: CatalogDetailInput) {
  try {
    if (type === 'movie') {
      const data = await fetchTmdb<MovieReleaseDatesResponse>(`/movie/${id}/release_dates`);
      return pickMovieCertification(data.results, region);
    }
    const data = await fetchTmdb<TvContentRatingsResponse>(`/tv/${id}/content_ratings`);
    return pickTvCertification(data.results, region);
  } catch (error) {
    console.error('Could not load title certification', { id, type, error });
    return null;
  }
}

async function loadDetails(fetchTmdb: TmdbFetch, { id, type }: CatalogDetailInput) {
  try {
    const data = await fetchTmdb<unknown>(`/${type}/${id}`);
    const details = detailsSchema.parse(data);
    if (details.id !== id) throw new Error('Upstream title identifier mismatch');
    const title = type === 'movie' ? details.title : details.name;
    if (!title.trim()) throw new Error('Upstream title is missing');
    return details;
  } catch (error) {
    if (error instanceof TmdbRequestError && error.status === 404) {
      throw new ORPCError('NOT_FOUND', { message: 'Title not found' });
    }
    throw error;
  }
}

export function createCatalogService(fetchTmdb: TmdbFetch): CatalogService {
  return {
    ...createCatalogSupportService(fetchTmdb),
    async details(input): Promise<CatalogDetail> {
      const [item, rating] = await Promise.all([
        loadDetails(fetchTmdb, input),
        certification(fetchTmdb, input),
      ]);
      const common = {
        id: item.id,
        title: input.type === 'movie' ? item.title : item.name,
        posterUrl: tmdbImageUrl(item.poster_path, 'w500'),
        backdropUrl: tmdbImageUrl(item.backdrop_path, 'w1280'),
        releaseDate: input.type === 'movie' ? item.release_date : item.first_air_date,
        rating: item.vote_average,
        overview: item.overview,
        tagline: item.tagline,
        genres: item.genres,
        voteCount: item.vote_count,
        popularity: item.popularity,
        originalTitle: input.type === 'movie' ? item.original_title : item.original_name,
        status: item.status,
        languages: item.spoken_languages.map((language) => language.english_name),
        originCountries: item.origin_country,
        homepage: publicHomepage(item.homepage),
        certification: rating,
      };
      if (input.type === 'movie') {
        return {
          ...common,
          type: 'movie',
          runtime: item.runtime ?? null,
          budget: item.budget,
          revenue: item.revenue,
        };
      }
      return {
        ...common,
        type: 'tv',
        seasons: item.number_of_seasons,
        episodes: item.number_of_episodes,
        episodeRuntimes: item.episode_run_time,
        lastAirDate: item.last_air_date,
        networks: item.networks.map((network) => network.name),
      };
    },
  };
}
