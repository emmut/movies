import { z } from 'zod';

import { catalogTitleInput } from './catalog-support';
import { imdbIdSchema } from './imdb';
import { episodeSchema, productionCompanySchema, seasonSummarySchema, pdpEntityInput } from './pdp';
import type { PersonInput } from './person';

// Full resource metadata is shared by server-rendered detail pages. Summary
// procedures retain their smaller projections for cards and native screens.
const text = z
  .string()
  .nullish()
  .transform((value) => value ?? '');
const nullableText = z.string().nullable().default(null);
const id = z.number().int().positive().max(Number.MAX_SAFE_INTEGER);
const numeric = z.number().default(0);
export const genreRecordsSchema = z.array(z.object({ id, name: z.string() }));
const language = z.object({ english_name: text, iso_639_1: text, name: text });
export const titleMetadataSchema = z.object({
  id,
  production_companies: z.array(productionCompanySchema).default([]),
  backdrop_path: text,
  poster_path: text,
  genres: genreRecordsSchema.default([]),
  homepage: text,
  origin_country: z.array(z.string()).default([]),
  original_language: text,
  overview: text,
  popularity: z.number().nonnegative().default(0),
  spoken_languages: z.array(language).default([]),
  status: text,
  tagline: text,
  vote_average: numeric,
  vote_count: z.number().int().nonnegative().default(0),
});
export const titleRuntimeSchema = z.number().int().nonnegative().nullish();

export const movieMetadataSchema = titleMetadataSchema.extend({
  adult: z.boolean().default(false),
  belongs_to_collection: z.object({ id, name: z.string() }).nullable().default(null),
  budget: z.number().nonnegative().default(0),
  imdb_id: text,
  original_title: text,
  release_date: text,
  revenue: z.number().nonnegative().default(0),
  runtime: titleRuntimeSchema.transform((value) => value ?? 0),
  title: z.string().min(1),
  video: z.boolean().default(false),
});
export const tvMetadataSchema = titleMetadataSchema.extend({
  name: z.string().min(1),
  original_name: text,
  first_air_date: text,
  last_air_date: text,
  number_of_episodes: z.number().int().nonnegative().default(0),
  number_of_seasons: z.number().int().nonnegative().default(0),
  episode_run_time: z.array(z.number().int().nonnegative()).default([]),
  networks: z
    .array(productionCompanySchema.extend({ logo_path: text, origin_country: text }))
    .default([]),
  created_by: z
    .array(z.object({ id, name: z.string(), profile_path: text, credit_id: text }))
    .default([]),
  seasons: z.array(seasonSummarySchema).default([]),
  next_episode_to_air: episodeSchema.nullable().default(null),
  last_episode_to_air: episodeSchema.nullable().default(null),
});
const creditPerson = z.object({
  id,
  name: z.string(),
  profile_path: nullableText,
  credit_id: text,
});
const cast = creditPerson.extend({
  adult: z.boolean().default(false),
  gender: numeric,
  known_for_department: text,
  original_name: text,
  popularity: numeric,
  cast_id: numeric,
  character: text,
  order: z.number().int().nonnegative().default(0),
});
const crew = creditPerson.extend({
  adult: z.boolean().default(false),
  gender: numeric,
  known_for_department: text,
  original_name: text,
  popularity: numeric,
  department: text,
  job: text,
});
export const movieCreditMetadataSchema = z.object({ id, cast: z.array(cast), crew: z.array(crew) });
export const tvCreditMetadataSchema = z.object({
  id,
  cast: z.array(creditPerson.extend({ profile_path: text, character: text })),
  crew: z.array(z.object({ id, name: z.string() })),
});
export const aggregateCreditMetadataSchema = z.object({
  cast: z.array(
    z.object({
      id,
      name: z.string(),
      profile_path: nullableText,
      total_episode_count: z.number().int().nonnegative(),
      roles: z.array(
        z.object({ character: z.string(), episode_count: z.number().int().nonnegative() }),
      ),
    }),
  ),
});
export const providerRecordSchema = z.object({
  provider_id: id,
  provider_name: z.string(),
  logo_path: text,
  display_priority: numeric,
});
const regionAvailability = z.object({
  link: text,
  rent: z.array(providerRecordSchema).optional(),
  buy: z.array(providerRecordSchema).optional(),
  flatrate: z.array(providerRecordSchema).optional(),
  free: z.array(providerRecordSchema).optional(),
  ads: z.array(providerRecordSchema).optional(),
});
export const availabilitySchema = z.object({ results: z.record(z.string(), regionAvailability) });
export const externalIdsSchema = z.object({ imdb_id: nullableText, wikidata_id: nullableText });
export const certificationSchema = z.object({ value: z.string(), region: z.string() }).nullable();
export const ratingInput = z.object({ imdbId: imdbIdSchema });
export const personMetadataSchema = z.object({
  id,
  name: z.string().min(1),
  biography: text,
  birthday: nullableText,
  deathday: nullableText,
  place_of_birth: nullableText,
  profile_path: nullableText,
  popularity: numeric,
  known_for_department: text,
  also_known_as: z.array(z.string()).default([]),
  homepage: nullableText,
  imdb_id: nullableText,
  known_for: z
    .array(
      z.object({
        id,
        title: z.string().optional(),
        name: z.string().optional(),
        media_type: z.enum(['movie', 'tv']),
      }),
    )
    .default([]),
});
const personCredit = z.object({
  id,
  poster_path: nullableText,
  character: text,
  credit_id: text,
  vote_count: z.number().int().nonnegative().default(0),
  genre_ids: z.array(id).default([]),
  order: z.number().int().nonnegative().optional(),
  vote_average: numeric,
  popularity: numeric,
});
const personCrew = z.object({
  id,
  title: text,
  original_title: text,
  release_date: text,
  poster_path: nullableText,
  job: text,
  department: text,
  credit_id: text,
  vote_average: numeric,
  popularity: numeric,
});
export const personMovieCreditsSchema = z.object({
  id,
  cast: z.array(personCredit.extend({ title: text, original_title: text, release_date: text })),
  crew: z.array(personCrew).default([]),
});
export const personTvCreditsSchema = z.object({
  id,
  cast: z.array(
    personCredit.extend({
      name: text,
      original_name: text,
      first_air_date: text,
      episode_count: numeric,
    }),
  ),
  crew: z.array(personCrew).default([]),
});
type ResourceInput = z.infer<typeof pdpEntityInput>;

export type CatalogMetadataService = {
  movieDetails(input: ResourceInput): Promise<z.infer<typeof movieMetadataSchema>>;
  tvDetails(input: ResourceInput): Promise<z.infer<typeof tvMetadataSchema>>;
  movieCredits(input: ResourceInput): Promise<z.infer<typeof movieCreditMetadataSchema>>;
  tvCredits(input: ResourceInput): Promise<z.infer<typeof tvCreditMetadataSchema>>;
  aggregateCredits(input: ResourceInput): Promise<z.infer<typeof aggregateCreditMetadataSchema>>;
  availability(
    input: z.infer<typeof catalogTitleInput>,
  ): Promise<z.infer<typeof availabilitySchema>>;
  externalIds(input: z.infer<typeof catalogTitleInput>): Promise<z.infer<typeof externalIdsSchema>>;
};
export type PersonMetadataService = {
  profile(input: PersonInput): Promise<z.infer<typeof personMetadataSchema>>;
  movieCredits(input: PersonInput): Promise<z.infer<typeof personMovieCreditsSchema>>;
  tvCredits(input: PersonInput): Promise<z.infer<typeof personTvCreditsSchema>>;
};
