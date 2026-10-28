import type { CatalogDetail } from '@movies/api/catalog';
import { formatCompactNumber, formatCurrency, formatRuntime } from '@movies/api/formatting';
import { displayRating } from '@movies/api/home';
import type { ImdbRating } from '@movies/api/imdb';

type Fact = { label: string; value: string };
export type CatalogStat = Fact & {
  accent: 'yellow' | 'blue' | 'green' | 'purple';
  description?: string;
};

function ratingStat(item: CatalogDetail, imdb: ImdbRating | null): CatalogStat {
  const score = displayRating(item.rating).toFixed(1);
  const stat: CatalogStat = {
    label: 'TMDB Rating',
    value: score,
    accent: 'yellow',
    description: item.voteCount.toLocaleString('en-US') + ' votes',
  };
  if (!imdb) {
    return stat;
  }
  return {
    ...stat,
    label: 'TMDB / IMDb',
    value: `${score} / ${imdb.rating}`,
    description: `${formatCompactNumber(item.voteCount)} / ${formatCompactNumber(imdb.numVotes)} votes`,
  };
}

export function catalogStats(item: CatalogDetail, imdb: ImdbRating | null = null): CatalogStat[] {
  const stats: CatalogStat[] = [ratingStat(item, imdb)];
  if (item.type === 'movie' && item.runtime && item.runtime > 0) {
    stats.push({ label: 'Runtime', value: formatRuntime(item.runtime), accent: 'blue' });
  }
  if (item.type === 'tv') {
    stats.push({ label: 'Seasons', value: String(item.seasons), accent: 'blue' });
  }
  const releaseLabel = item.type === 'movie' ? 'Released' : 'First Aired';
  stats.push({
    label: releaseLabel,
    value: item.releaseDate.slice(0, 4) || 'N/A',
    accent: 'green',
  });
  stats.push({ label: 'Popularity', value: String(Math.round(item.popularity)), accent: 'purple' });
  return stats;
}

function addFact(facts: Fact[], label: string, value: string) {
  if (value) {
    facts.push({ label, value });
  }
}
function movieMoney(item: Extract<CatalogDetail, { type: 'movie' }>, facts: Fact[]) {
  if (item.budget > 0) {
    addFact(facts, 'Budget', formatCurrency(item.budget, false));
  }
  if (item.revenue > 0) {
    addFact(facts, 'Revenue', formatCurrency(item.revenue, false));
  }
  if (item.budget > 0 && item.revenue > 0) {
    addFact(facts, 'Profit', formatCurrency(item.revenue - item.budget, false));
  }
}
function tvFacts(item: Extract<CatalogDetail, { type: 'tv' }>, facts: Fact[]) {
  addFact(facts, 'Last Air Date', item.lastAirDate);
  addFact(facts, 'Episodes', String(item.episodes));
  addFact(facts, 'Seasons', String(item.seasons));
  addFact(facts, 'Episode Runtime', item.episodeRuntimes.map(formatRuntime).join(', '));
  addFact(facts, 'Networks', item.networks.join(', '));
}

function originalTitle(item: CatalogDetail) {
  if (item.type === 'movie') {
    return item.originalTitle;
  }
  return item.originalTitle === item.title ? '' : item.originalTitle;
}

export function catalogFacts(item: CatalogDetail): Fact[] {
  const facts: Fact[] = [{ label: 'Status', value: item.status || 'Unknown' }];
  const originalLabel = item.type === 'movie' ? 'Original Title' : 'Original Name';
  addFact(facts, originalLabel, originalTitle(item));
  const dateLabel = item.type === 'movie' ? 'Release Date' : 'First Air Date';
  addFact(facts, dateLabel, item.releaseDate || 'Not available');
  addFact(facts, 'Languages', item.languages.join(', '));
  if (item.type === 'movie') {
    movieMoney(item, facts);
  } else {
    tvFacts(item, facts);
  }
  return facts;
}
