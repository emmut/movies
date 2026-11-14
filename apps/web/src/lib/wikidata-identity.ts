import { z } from 'zod';

const itemId = z.string().regex(/^Q[1-9]\d*$/);
const imdbSchema = z.string().regex(/^tt\d{7,10}$/);
const identifierStatement = z.object({
  rank: z.enum(['normal', 'preferred']),
  mainsnak: z.object({
    snaktype: z.literal('value'),
    datatype: z.literal('external-id'),
    datavalue: z.object({ value: z.string() }),
  }),
});

function identifiers(claims: Record<string, unknown>, property: string) {
  const raw = claims[property];
  if (!Array.isArray(raw)) return [];
  return [
    ...new Set(
      raw.flatMap((value) => {
        const parsed = identifierStatement.safeParse(value);
        return parsed.success ? [parsed.data.mainsnak.datavalue.value] : [];
      }),
    ),
  ];
}

/** Search exact external identifiers only; never title text. */
export function wikidataIdentitySearch(type: 'movie' | 'tv', id: number, imdbId: string | null) {
  const tmdb = `haswbstatement:${type === 'movie' ? 'P4947' : 'P4983'}=${id}`;
  return imdbSchema.safeParse(imdbId).success ? `${tmdb} OR haswbstatement:P345=${imdbId}` : tmdb;
}

export function matchesWikidataIdentity(
  claims: Record<string, unknown>,
  type: 'movie' | 'tv',
  id: number,
  imdbId: string | null,
) {
  const property = type === 'movie' ? 'P4947' : 'P4983';
  const tmdb = identifiers(claims, property);
  if (tmdb.length) return tmdb.length === 1 && tmdb[0] === String(id);
  // An IMDb match must not hide a conflicting resource namespace or another edition.
  if (identifiers(claims, type === 'movie' ? 'P4983' : 'P4947').length) return false;
  const imdb = identifiers(claims, 'P345');
  return imdbSchema.safeParse(imdbId).success && imdb.length === 1 && imdb[0] === imdbId;
}

/** Resolve only the redirect chain declared for the requested item, never an arbitrary returned entity. */
export function canonicalWikidataItem(requested: string, redirects: unknown) {
  const rows = z
    .array(z.object({ from: itemId, to: itemId }))
    .max(10)
    .parse(redirects ?? []);
  const seen = new Set<string>();
  let current = requested;
  while (true) {
    if (seen.has(current)) throw new Error('Cyclic Wikidata redirect');
    seen.add(current);
    const targets = [...new Set(rows.filter((row) => row.from === current).map((row) => row.to))];
    if (targets.length === 0) return current;
    if (targets.length > 1) throw new Error('Ambiguous Wikidata redirect');
    current = targets[0];
  }
}
