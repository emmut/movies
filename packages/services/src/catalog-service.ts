import type { CatalogDetail, CatalogDetailInput } from '@movies/api/catalog';
import {
  pickMovieCertification,
  pickTvCertification,
  type MovieReleaseDatesResponse,
  type TvContentRatingsResponse,
} from '@movies/api/certifications';
import 'server-only';
import {
  movieMetadataSchema,
  tvMetadataSchema,
  titleMetadataSchema,
  titleRuntimeSchema,
} from '@movies/api/metadata';
import type { CatalogService } from '@movies/api/router';
import { TmdbRequestError, type TmdbFetch } from '@movies/api/tmdb-fetch';
import { createCatalogCreditsService } from '@movies/services/catalog-credits-service';
import {
  createCatalogImdbService,
  type CatalogImdbOptions,
} from '@movies/services/catalog-imdb-service';
import { createCatalogPdpService } from '@movies/services/catalog-pdp-service';
import { createCatalogReviewsService } from '@movies/services/catalog-reviews-service';
import { createCatalogSupportService } from '@movies/services/catalog-support-service';
import { publicWebUrl, tmdbImageUrl } from '@movies/services/media-card';
import {
  createWatchLinksService,
  type WikidataClaimsReader,
} from '@movies/services/watch-links-service';
import { ORPCError } from '@orpc/server';
import { z } from 'zod';

import { createCatalogMetadataService } from './catalog-metadata-service';

const text = z
  .string()
  .nullish()
  .transform((value) => value ?? '');
const detailsSchema = titleMetadataSchema
  .omit({
    production_companies: true,
    original_language: true,
  })
  .extend({
    ...movieMetadataSchema.pick({
      original_title: true,
      release_date: true,
      budget: true,
      revenue: true,
    }).shape,
    ...tvMetadataSchema.pick({
      original_name: true,
      first_air_date: true,
      last_air_date: true,
      number_of_seasons: true,
      number_of_episodes: true,
      episode_run_time: true,
      created_by: true,
    }).shape,
    title: text,
    name: text,
    runtime: titleRuntimeSchema,
    networks: z.array(z.object({ name: z.string() })).default([]),
  });

async function readCertification(fetchTmdb: TmdbFetch, { id, type, region }: CatalogDetailInput) {
  if (type === 'movie') {
    const data = await fetchTmdb<MovieReleaseDatesResponse>(`/movie/${id}/release_dates`);
    return pickMovieCertification(data.results, region);
  }
  const data = await fetchTmdb<TvContentRatingsResponse>(`/tv/${id}/content_ratings`);
  return pickTvCertification(data.results, region);
}

async function certification(fetchTmdb: TmdbFetch, input: CatalogDetailInput) {
  try {
    return await readCertification(fetchTmdb, input);
  } catch (error) {
    console.error('Could not load title certification', { ...input, error });
    return null;
  }
}

async function loadDetails(fetchTmdb: TmdbFetch, { id, type }: CatalogDetailInput) {
  try {
    const data = await fetchTmdb<unknown>(`/${type}/${id}`);
    const details = detailsSchema.parse(data);
    if (details.id !== id) {
      throw new Error('Upstream title identifier mismatch');
    }
    const title = type === 'movie' ? details.title : details.name;
    if (!title.trim()) {
      throw new Error('Upstream title is missing');
    }
    return details;
  } catch (error) {
    if (error instanceof TmdbRequestError && error.status === 404) {
      throw new ORPCError('NOT_FOUND', { message: 'Title not found' });
    }
    throw error;
  }
}

export function createCatalogService(
  fetchTmdb: TmdbFetch,
  imdbOptions: CatalogImdbOptions & { readWikidataClaims?: WikidataClaimsReader } = {},
): CatalogService {
  return {
    ...createCatalogMetadataService(fetchTmdb),
    ...createCatalogSupportService(fetchTmdb),
    certification(input) {
      return readCertification(fetchTmdb, input);
    },
    ...createWatchLinksService(fetchTmdb, undefined, imdbOptions.readWikidataClaims),
    ...createCatalogPdpService(fetchTmdb),
    ...createCatalogCreditsService(fetchTmdb),
    ...createCatalogImdbService(fetchTmdb, imdbOptions),
    ...createCatalogReviewsService(fetchTmdb),
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
        homepage: publicWebUrl(item.homepage),
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
        creators: item.created_by.map((person) => ({
          id: person.id,
          creditId: person.credit_id || 'creator:' + person.id,
          name: person.name,
          role: 'Creator',
          profileUrl: tmdbImageUrl(person.profile_path, 'w185'),
        })),
      };
    },
  };
}
