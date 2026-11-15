/** Ranking fields shared by web cards and the native person-credit API. */
export type PersonTitle = {
  id: number;
  type: 'movie' | 'tv';
  releaseDate: string;
  posterUrl: string | null;
  rating: number;
  genreIds?: number[];
  voteCount?: number;
  popularity?: number;
  character?: string;
  order?: number;
  episodeCount?: number;
};

export type CreditSort = 'relevance' | 'rating' | 'newest';

// TMDB genres for news, reality and talk shows.
const APPEARANCE_GENRE_IDS = [10763, 10764, 10767];
const KNOWN_FOR_LIMIT = 8;

function isAppearance(credit: PersonTitle): boolean {
  const appearanceGenre = (credit.genreIds ?? []).some((id) => APPEARANCE_GENRE_IDS.includes(id));
  // Host/guest/presenter can be fictional roles; require an explicit self marker.
  const playsSelf = /\b(self|himself|herself|themselves)\b/i.test(credit.character ?? '');
  return appearanceGenre || playsSelf;
}

function releaseDate(credit: PersonTitle): string {
  return credit.releaseDate || '';
}

/** Billing order for films; episode count stands in for TV credits without one. */
function prominence(credit: PersonTitle): number {
  if (credit.order === undefined) {
    return Math.log10(1 + Math.min(credit.episodeCount ?? 0, 100)) / 4;
  }
  return 1 / (1 + credit.order / 5);
}

function relevance(credit: PersonTitle): number {
  // Smooth small-sample ratings toward 6, then reward widely recognised titles.
  const votes = Math.max(0, credit.voteCount ?? 0);
  const rating = (credit.rating * votes + 6 * 100) / (votes + 100);
  return (
    rating +
    Math.log10(1 + votes) +
    Math.log10(1 + Math.max(0, credit.popularity ?? 0)) * 0.5 +
    prominence(credit)
  );
}

function compareRelevance(a: PersonTitle, b: PersonTitle): number {
  return Number(isAppearance(a)) - Number(isAppearance(b)) || relevance(b) - relevance(a);
}

function compareRating(a: PersonTitle, b: PersonTitle): number {
  return b.rating - a.rating || (b.voteCount ?? 0) - (a.voteCount ?? 0);
}

function compareNewest(a: PersonTitle, b: PersonTitle): number {
  return releaseDate(b).localeCompare(releaseDate(a));
}

const comparators = { relevance: compareRelevance, rating: compareRating, newest: compareNewest };

/** Keep every credit, but prefer acting roles over self, host and talk-show appearances. */
export function sortPersonTitles<T extends PersonTitle>(
  titles: T[],
  sort: CreditSort = 'relevance',
): T[] {
  const sorted = [...titles].sort((a, b) => comparators[sort](a, b) || a.id - b.id);
  const seen = new Set<string>();
  return sorted.filter((title) => {
    const key = `${title.type}:${title.id}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function isKnownForCandidate(title: PersonTitle, today: string): boolean {
  const hasVotes = (title.voteCount ?? 0) > 0;
  if (isAppearance(title) || !title.posterUrl || !hasVotes) {
    return false;
  }
  const date = releaseDate(title);
  return date !== '' && date <= today;
}

export function getKnownFor<T extends PersonTitle>(
  titles: T[],
  today = new Date().toISOString().slice(0, 10),
): T[] {
  return sortPersonTitles(titles)
    .filter((title) => isKnownForCandidate(title, today))
    .slice(0, KNOWN_FOR_LIMIT);
}

/** Preserve credit-specific fields that the generic movie/TV card mapper does not need. */
export function personCreditFields(
  credit: {
    id: number;
    release_date?: string;
    first_air_date?: string;
    poster_path: string | null;
    vote_average: number;
    vote_count?: number;
    genre_ids?: number[];
    popularity: number;
    character?: string;
    order?: number;
    episode_count?: number;
  },
  type: 'movie' | 'tv',
): PersonTitle {
  return {
    id: credit.id,
    type,
    releaseDate: credit.release_date ?? credit.first_air_date ?? '',
    posterUrl: credit.poster_path,
    rating: credit.vote_average,
    voteCount: credit.vote_count ?? 0,
    genreIds: credit.genre_ids ?? [],
    popularity: credit.popularity,
    character: credit.character,
    order: credit.order,
    episodeCount: credit.episode_count,
  };
}
