import type { SearchQueryMediaType } from './parse-search-query';

export type SearchIndexHit = {
  tmdbId: number;
  mediaType: SearchQueryMediaType;
  title: string;
  popularity: number;
  similarity: number;
  score: number;
};
export type SearchIndexOptions = {
  mediaType?: SearchQueryMediaType;
  limit: number;
};
