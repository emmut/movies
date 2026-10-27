import 'server-only';
import type { CatalogService } from '@movies/api/router';
import type { TmdbFetch } from '@movies/api/tmdb-fetch';
import { tmdbImageUrl } from '@server/media-card';
import { z } from 'zod';

const personSchema = z.object({
  credit_id: z.string(),
  id: z.number().int().positive(),
  name: z.string(),
  profile_path: z.string().nullable().default(null),
});
const creditsSchema = z.object({
  cast: z.array(personSchema.extend({ character: z.string().default('') })),
  crew: z.array(personSchema.extend({ job: z.string() })),
});
const writerJobs = new Set(['Writer', 'Screenplay', 'Story', 'Original Story']);

function creditPerson(person: z.infer<typeof personSchema>, role: string) {
  return {
    creditId: person.credit_id,
    id: person.id,
    name: person.name,
    role,
    profileUrl: tmdbImageUrl(person.profile_path, 'w185'),
  };
}

/** Billed order and writing credits match the web movie/TV credits sections. */
export function createCatalogCreditsService(fetchTmdb: TmdbFetch): Pick<CatalogService, 'credits'> {
  return {
    async credits({ id, type }) {
      const data = creditsSchema.parse(await fetchTmdb<unknown>(`/${type}/${id}/credits`));
      const movieCrew = type === 'movie' ? data.crew : [];
      return {
        cast: data.cast.map((person) => creditPerson(person, person.character)),
        directors: movieCrew
          .filter((person) => person.job === 'Director')
          .map((person) => creditPerson(person, person.job)),
        writers: movieCrew
          .filter((person) => writerJobs.has(person.job))
          .map((person) => creditPerson(person, person.job)),
      };
    },
  };
}
