/**
 * Folds a title for trigram matching: Unicode-decomposed with combining
 * marks stripped (so "Amélie" and "Amelie" agree), lowercased, and every
 * run of punctuation or whitespace collapsed to one space ("Spider-Man" →
 * "spider man"). Letters and digits of every script survive. Apply the same
 * fold to queries.
 */
export function normalizeSearchTitle(title: string) {
  return title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}
