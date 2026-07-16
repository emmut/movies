import { Star } from 'lucide-react';

import type { ImdbRating } from '@/lib/imdb';
import { formatCompactNumber } from '@/lib/utils';

type RatingsCardProps = {
  score: number;
  voteCount: number;
  imdbRating: ImdbRating | null;
};

/**
 * The detail-page ratings stat card. Shows the TMDb score alone, or TMDb and
 * IMDb slash-separated when the title has an ingested IMDb rating — one card
 * for one kind of fact, instead of two near-identical star cards.
 */
export function RatingsCard({ score, voteCount, imdbRating }: RatingsCardProps) {
  return (
    <div className="rounded-lg bg-zinc-900 p-5">
      <Star className="mb-3 h-5 w-5 text-yellow-500" />
      <div className="text-2xl font-bold">
        {score}
        {imdbRating && ` / ${imdbRating.rating}`}
      </div>
      <div className="text-sm text-zinc-400">TMDB{imdbRating && ' / IMDb'}</div>
      <div className="text-xs whitespace-nowrap text-zinc-500">
        {formatCompactNumber(voteCount)}
        {imdbRating && ` / ${formatCompactNumber(imdbRating.numVotes)}`} votes
      </div>
    </div>
  );
}
