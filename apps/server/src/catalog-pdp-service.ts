import 'server-only';
import {
  productionCompanySchema,
  seasonSummarySchema,
  episodeSchema,
  seasonPageSchema,
  collectionPageSchema,
  type PdpService,
} from '@movies/api/pdp';
import {
  getGalleryImages,
  getKeywords,
  getPlayableVideos,
  getRegionalReleases,
} from '@movies/api/pdp-extra-content';
import type { TmdbFetch } from '@movies/api/tmdb-fetch';
import { tmdbCardSchema, toMediaCard } from '@server/media-card';
import { z } from 'zod';

const id = z.number().int().positive();
const extrasSchema = z.object({
  id,
  production_companies: z.array(productionCompanySchema).default([]),
  belongs_to_collection: z.object({ id, name: z.string() }).nullish(),
  images: z
    .object({
      backdrops: z.array(z.object({ file_path: z.string() })),
      posters: z.array(z.object({ file_path: z.string() })),
    })
    .optional(),
  keywords: z
    .object({
      keywords: z.array(z.object({ id, name: z.string() })).optional(),
      results: z.array(z.object({ id, name: z.string() })).optional(),
    })
    .optional(),
  videos: z
    .object({
      id: id.default(1),
      results: z.array(
        z.object({
          id: z.string(),
          key: z.string(),
          name: z.string(),
          type: z.string(),
          site: z.string(),
          official: z.boolean().default(false),
          published_at: z.string().default(''),
          size: z.number().default(0),
          iso_639_1: z.string().default(''),
          iso_3166_1: z.string().default(''),
        }),
      ),
    })
    .optional(),
  release_dates: z
    .object({
      id: id.default(1),
      results: z.array(
        z.object({
          iso_3166_1: z.string(),
          release_dates: z.array(
            z.object({
              certification: z.string().default(''),
              iso_639_1: z.string().default(''),
              release_date: z.string(),
              type: z.number(),
            }),
          ),
        }),
      ),
    })
    .optional(),
  seasons: z.array(seasonSummarySchema).default([]),
  next_episode_to_air: episodeSchema.nullish(),
  last_episode_to_air: episodeSchema.nullish(),
});

export function createCatalogPdpService(fetchTmdb: TmdbFetch): PdpService {
  return {
    async extras({ id, type, region }) {
      const item = extrasSchema.parse(
        await fetchTmdb(`/${type}/${id}`, {
          searchParams: {
            append_to_response:
              type === 'movie' ? 'images,keywords,videos,release_dates' : 'images,keywords,videos',
            include_image_language: 'en,null',
          },
        }),
      );
      if (item.id !== id) {
        throw new Error('Upstream title identifier mismatch');
      }
      return {
        companies: item.production_companies,
        collection: item.belongs_to_collection ?? null,
        images: getGalleryImages(item.images),
        videos: getPlayableVideos(item.videos),
        keywords: getKeywords(item.keywords),
        releases: getRegionalReleases(item.release_dates, region),
        seasons: item.seasons,
        next: item.next_episode_to_air ?? null,
        latest: item.last_episode_to_air ?? null,
      };
    },
    async season({ id, season }) {
      return seasonPageSchema.parse(await fetchTmdb(`/tv/${id}/season/${season}`));
    },
    async collection({ id }) {
      return collectionPageSchema.parse(await fetchTmdb(`/collection/${id}`));
    },
    async keyword({ id, type, page, region }) {
      const [keyword, data] = await Promise.all([
        fetchTmdb(`/keyword/${id}`).then((value) => z.object({ name: z.string() }).parse(value)),
        fetchTmdb(`/discover/${type}`, {
          searchParams: {
            with_keywords: id,
            page,
            region,
            include_adult: 'false',
            sort_by: 'popularity.desc',
          },
        }).then((value) =>
          z
            .object({
              results: z.array(tmdbCardSchema),
              total_pages: z.number().int().nonnegative(),
            })
            .parse(value),
        ),
      ]);
      return {
        name: keyword.name,
        items: data.results.map((item) => toMediaCard(item, type)),
        page,
        totalPages: Math.min(data.total_pages, 500),
      };
    },
  };
}
