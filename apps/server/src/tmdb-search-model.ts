import 'server-only';
import { z } from 'zod';

const id = z.number().int().positive().max(Number.MAX_SAFE_INTEGER);
const text = z
  .string()
  .nullish()
  .transform((value) => value ?? '');
const image = z
  .string()
  .nullish()
  .transform((value) => value ?? null);
const genre = z.object({ id, name: z.string() });
const language = z.object({ english_name: text, iso_639_1: text, name: text });
const common = {
  id,
  popularity: z.number().default(0),
  overview: text,
  original_language: text,
  backdrop_path: text,
  poster_path: image,
  vote_average: z.number().default(0),
  vote_count: z.number().int().nonnegative().default(0),
  genre_ids: z.array(id).default([]),
};
export const searchedMovieSchema = z.object({
  ...common,
  title: z.string(),
  original_title: text,
  release_date: text,
  adult: z.boolean().default(false),
  video: z.boolean().default(false),
  media_type: z.literal('movie').default('movie'),
});
export const searchedTvSchema = z.object({
  ...common,
  name: z.string(),
  original_name: text,
  first_air_date: text,
  origin_country: z.array(z.string()).default([]),
  media_type: z.literal('tv').default('tv'),
});
const knownFor = z.object({
  id,
  title: z.string().optional(),
  name: z.string().optional(),
  media_type: z.enum(['movie', 'tv']),
});
export const searchedPersonSchema = z.object({
  id,
  name: z.string(),
  profile_path: image,
  popularity: z.number().default(0),
  known_for_department: text,
  known_for: z.array(knownFor).default([]),
  media_type: z.literal('person').default('person'),
});
export const searchedMultiSchema = z.discriminatedUnion('media_type', [
  searchedMovieSchema,
  searchedTvSchema,
  searchedPersonSchema,
]);
export function tmdbSearchPageSchema<T extends z.ZodType>(record: T) {
  return z.object({
    results: z.array(record),
    total_pages: z.number().int().nonnegative(),
    total_results: z.number().int().nonnegative(),
  });
}
const detailFields = {
  genres: z.array(genre).default([]),
  homepage: text,
  status: text,
  tagline: text,
  poster_path: text,
  spoken_languages: z.array(language).default([]),
};
export const movieDetailsSchema = searchedMovieSchema.extend({
  ...detailFields,
  imdb_id: text,
  origin_country: z.array(z.string()).default([]),
  budget: z.number().default(0),
  revenue: z.number().default(0),
  runtime: z
    .number()
    .int()
    .nonnegative()
    .nullish()
    .transform((value) => value ?? 0),
});
export const tvDetailsSchema = searchedTvSchema.extend({
  ...detailFields,
  last_air_date: text,
  number_of_episodes: z.number().int().nonnegative().default(0),
  number_of_seasons: z.number().int().nonnegative().default(0),
  episode_run_time: z.array(z.number()).default([]),
  networks: z
    .array(z.object({ id, name: z.string(), logo_path: text, origin_country: text }))
    .default([]),
  created_by: z
    .array(z.object({ id, name: z.string(), profile_path: text, credit_id: text }))
    .default([]),
});
export const personDetailsSchema = searchedPersonSchema.extend({
  biography: text,
  birthday: image,
  deathday: image,
  place_of_birth: image,
  also_known_as: z.array(z.string()).default([]),
  homepage: image,
  imdb_id: image,
});
