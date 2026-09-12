import { normalizeSearchTitle } from './search-index-ingest';

/** The name fields a TMDB search hit may carry, across movies, TV shows and people. */
export type RankableResult = {
  title?: string;
  original_title?: string;
  name?: string;
  original_name?: string;
};

/**
 * How closely a hit's name matches the query, from best to worst. Ordered so
 * that a higher value is a closer match.
 */
export const MATCH_TIER = {
  none: 0,
  contains: 1,
  prefix: 2,
  wordPrefix: 3,
  exact: 4,
} as const;

export type MatchTier = (typeof MATCH_TIER)[keyof typeof MATCH_TIER];

function tierForName(name: string, query: string): MatchTier {
  if (name === query) {
    return MATCH_TIER.exact;
  }
  if (name.startsWith(`${query} `)) {
    return MATCH_TIER.wordPrefix;
  }
  if (name.startsWith(query)) {
    return MATCH_TIER.prefix;
  }
  if (name.includes(query)) {
    return MATCH_TIER.contains;
  }
  return MATCH_TIER.none;
}

function namesOf(result: RankableResult) {
  return [result.title, result.original_title, result.name, result.original_name].filter(
    (name): name is string => typeof name === 'string' && name.length > 0,
  );
}

/**
 * The best match tier across all of a hit's names, comparing folded forms
 * (see {@link normalizeSearchTitle}) so case, accents and punctuation do not
 * count against a match.
 */
export function matchTier(result: RankableResult, query: string): MatchTier {
  const folded = normalizeSearchTitle(query);
  if (folded.length === 0) {
    return MATCH_TIER.none;
  }
  let best: MatchTier = MATCH_TIER.none;
  for (const name of namesOf(result)) {
    const tier = tierForName(normalizeSearchTitle(name), folded);
    if (tier > best) {
      best = tier;
    }
    if (best === MATCH_TIER.exact) {
      break;
    }
  }
  return best;
}

/**
 * Re-orders one page of search hits so the closest title matches come first:
 * exact, then the query as a leading word ("alien" → "Alien Romulus"), then
 * as a plain prefix ("Aliens"), then anywhere in the title. The sort is stable,
 * so within a tier the incoming order (TMDB's own relevance, or an explicit
 * popularity sort) still decides.
 */
export function rankByTitleMatch<T extends RankableResult>(query: string, results: T[]): T[] {
  if (results.length < 2) {
    return results;
  }
  const tiers = new Map<T, MatchTier>();
  for (const result of results) {
    tiers.set(result, matchTier(result, query));
  }
  return [...results].sort((a, b) => (tiers.get(b) ?? 0) - (tiers.get(a) ?? 0));
}
