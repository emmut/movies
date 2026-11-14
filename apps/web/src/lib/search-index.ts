import 'server-only';
import { createSearchHydrator } from '@movies/api/search-hydration';
import type { SearchIndexHit, SearchIndexOptions } from '@movies/api/search-index-model';
import { createSearchIndexReader } from '@movies/db/search-index';

import { db } from '@/lib/db';
import { getMovieDetails } from '@/lib/movies';
import { getPersonDetails } from '@/lib/persons';
import { getTvShowDetails } from '@/lib/tv-shows';

export async function searchIndexFuzzy(
  query: string,
  options: SearchIndexOptions,
): Promise<SearchIndexHit[]> {
  return createSearchIndexReader(db).searchIndexFuzzy(query, options);
}
export async function hydrateSearchIndexHits(hits: SearchIndexHit[]) {
  return createSearchHydrator({
    movie: getMovieDetails,
    tv: getTvShowDetails,
    person: getPersonDetails,
  }).hydrateSearchIndexHits(hits);
}
