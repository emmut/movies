import 'server-only';
import { watchProviderIdSchema, type ProviderChoice } from '@movies/api/preferences';
import type { TmdbFetch } from '@movies/api/tmdb-fetch';
import { tmdbImageUrl } from '@server/media-card';
import { z } from 'zod';

const responseSchema = z.object({
  results: z.array(
    z.object({
      provider_id: watchProviderIdSchema,
      provider_name: z.string(),
      logo_path: z.string().nullable(),
      display_priority: z.number().default(0),
    }),
  ),
});

export async function readWatchProviders(
  fetchTmdb: TmdbFetch,
  type: 'movie' | 'tv',
  region: string,
) {
  const data = await fetchTmdb('/watch/providers/' + type, {
    searchParams: { watch_region: region },
  });
  return responseSchema.parse(data).results;
}

export function toProviderChoices(
  records: z.infer<typeof responseSchema>['results'],
): ProviderChoice[] {
  return records.map((provider) => ({
    id: provider.provider_id,
    name: provider.provider_name,
    logoUrl: tmdbImageUrl(provider.logo_path, 'w92'),
  }));
}
