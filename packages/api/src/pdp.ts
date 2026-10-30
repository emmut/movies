import { z } from 'zod';

import { catalogDetailInput } from './catalog';
import { youtubeKeySchema } from './catalog-support';
import { mediaCardSchema } from './home';

export const pdpId = z.number().int().positive().max(Number.MAX_SAFE_INTEGER);
export const pdpEntityInput = z.object({ id: pdpId });
export const seasonInput = pdpEntityInput.extend({ season: z.number().int().min(0).max(10000) });
export const keywordInput = catalogDetailInput.extend({
  page: z.number().int().min(1).max(500).default(1),
});
export const productionCompanySchema = z.object({
  id: pdpId,
  name: z.string(),
  logo_path: z.string().nullable().default(null),
});
export const seasonSummarySchema = z.object({
  id: pdpId,
  name: z.string(),
  season_number: z.number().int().nonnegative(),
  episode_count: z.number().int().nonnegative(),
  poster_path: z.string().nullable().default(null),
  air_date: z.string().nullable().default(null),
});
export const episodeSchema = z.object({
  id: pdpId,
  name: z.string(),
  episode_number: z.number().int().nonnegative(),
  season_number: z.number().int().nonnegative(),
  air_date: z.string().nullable().default(null),
  overview: z.string().default(''),
  still_path: z.string().nullable().default(null),
  runtime: z.number().nonnegative().nullable().default(null),
  vote_average: z.number().min(0).max(10).default(0),
  vote_count: z.number().int().nonnegative().default(0),
});
export const pdpExtrasSchema = z.object({
  companies: z.array(productionCompanySchema),
  collection: z.object({ id: pdpId, name: z.string() }).nullable(),
  images: z.array(z.object({ file_path: z.string() })),
  videos: z.array(
    z.object({
      id: z.string(),
      key: youtubeKeySchema,
      name: z.string(),
      type: z.string(),
      official: z.boolean(),
    }),
  ),
  keywords: z.array(z.object({ id: pdpId, name: z.string() })),
  releases: z.array(z.object({ key: z.string(), label: z.string(), date: z.string() })),
  seasons: z.array(seasonSummarySchema),
  next: episodeSchema.nullable(),
  latest: episodeSchema.nullable(),
});
export const seasonPageSchema = z.object({ name: z.string(), episodes: z.array(episodeSchema) });
export const collectionPageSchema = z.object({
  name: z.string(),
  parts: z.array(
    z.object({
      id: pdpId,
      title: z.string(),
      poster_path: z.string().nullable(),
      release_date: z.string(),
    }),
  ),
});
export const keywordPageSchema = z.object({
  name: z.string(),
  items: z.array(mediaCardSchema),
  page: z.number().int().min(1).max(500),
  totalPages: z.number().int().min(0).max(500),
});
export type PdpExtras = z.infer<typeof pdpExtrasSchema>;
export type SeasonPage = z.infer<typeof seasonPageSchema>;
export type CollectionPage = z.infer<typeof collectionPageSchema>;
export type KeywordPage = z.infer<typeof keywordPageSchema>;
export type SeasonInput = z.infer<typeof seasonInput>;
export type KeywordInput = z.infer<typeof keywordInput>;
export type PdpService = {
  extras(input: z.infer<typeof catalogDetailInput>): Promise<PdpExtras>;
  season(input: SeasonInput): Promise<SeasonPage>;
  collection(input: z.infer<typeof pdpEntityInput>): Promise<CollectionPage>;
  keyword(input: KeywordInput): Promise<KeywordPage>;
};
