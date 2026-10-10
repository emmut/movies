import type { CatalogDetail } from '@movies/api/catalog';
import { formatCurrency, formatRuntime } from '@movies/api/formatting';
import { displayRating } from '@movies/api/home';

type Fact = { label: string; value: string };
export type CatalogStat = Fact & { accent: 'yellow' | 'blue' | 'green' | 'purple' };

export function catalogStats(item: CatalogDetail): CatalogStat[] {
  const stats: CatalogStat[] = [
    {
      label: 'TMDB Rating',
      value: displayRating(item.rating).toFixed(1),
      accent: 'yellow',
    },
  ];
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
  if (value) facts.push({ label, value });
}
function movieMoney(item: Extract<CatalogDetail, { type: 'movie' }>, facts: Fact[]) {
  if (item.budget > 0) addFact(facts, 'Budget', formatCurrency(item.budget, false));
  if (item.revenue > 0) addFact(facts, 'Revenue', formatCurrency(item.revenue, false));
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
  if (item.type === 'movie') return item.originalTitle;
  return item.originalTitle === item.title ? '' : item.originalTitle;
}

export function catalogFacts(item: CatalogDetail): Fact[] {
  const facts: Fact[] = [{ label: 'Status', value: item.status || 'Unknown' }];
  const originalLabel = item.type === 'movie' ? 'Original Title' : 'Original Name';
  addFact(facts, originalLabel, originalTitle(item));
  const dateLabel = item.type === 'movie' ? 'Release Date' : 'First Air Date';
  addFact(facts, dateLabel, item.releaseDate || 'Not available');
  addFact(facts, 'Languages', item.languages.join(', '));
  if (item.type === 'movie') movieMoney(item, facts);
  else tvFacts(item, facts);
  return facts;
}
