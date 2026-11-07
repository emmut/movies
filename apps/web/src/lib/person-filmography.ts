import type { Movie } from '@/types/movie';
import type { TvShow } from '@/types/tv-show';

export type PersonTitle = (Movie | TvShow) & {
  character?: string;
  order?: number;
  episode_count?: number;
};

export type CreditSort = 'relevance' | 'rating' | 'newest';

function isAppearance(credit: PersonTitle) {
  return (
    credit.genre_ids.some((id) => [10763, 10764, 10767].includes(id)) ||
    // Host/guest/presenter can be fictional roles; require an explicit self marker.
    /\b(self|himself|herself|themselves)\b/i.test(credit.character ?? '')
  );
}

function releaseDate(credit: PersonTitle) {
  return ('release_date' in credit ? credit.release_date : credit.first_air_date) || '';
}

function relevance(credit: PersonTitle) {
  // Smooth small-sample ratings toward 6, then reward widely recognised titles.
  const votes = Math.max(0, credit.vote_count);
  const rating = (credit.vote_average * votes + 6 * 100) / (votes + 100);
  const prominence =
    credit.order === undefined
      ? Math.log10(1 + Math.min(credit.episode_count ?? 0, 100)) / 4
      : 1 / (1 + credit.order / 5);
  return (
    rating +
    Math.log10(1 + votes) +
    Math.log10(1 + Math.max(0, credit.popularity)) * 0.5 +
    prominence
  );
}

function compareRelevance(a: PersonTitle, b: PersonTitle) {
  return Number(isAppearance(a)) - Number(isAppearance(b)) || relevance(b) - relevance(a);
}

function compareRating(a: PersonTitle, b: PersonTitle) {
  return b.vote_average - a.vote_average || b.vote_count - a.vote_count;
}

function compareNewest(a: PersonTitle, b: PersonTitle) {
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
    const key = `${title.media_type}:${title.id}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

export function getKnownFor(titles: PersonTitle[], today = new Date().toISOString().slice(0, 10)) {
  return sortPersonTitles(titles)
    .filter((title) => {
      const date = releaseDate(title);
      return (
        !isAppearance(title) && title.poster_path && title.vote_count > 0 && date && date <= today
      );
    })
    .slice(0, 8);
}
