import { Star } from 'lucide-react';

import type { ImdbRating } from '@/lib/imdb';
import { formatCompactNumber } from '@/lib/utils';

type RatingsCardProps = {
  score: number;
  voteCount: number;
  imdbRating: ImdbRating | null;
};

function RatingValue({ value, source, votes }: { value: number; source: string; votes: number }) {
  return (
    <div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm text-zinc-400">{source}</div>
      <div className="text-xs whitespace-nowrap text-zinc-500">
        {formatCompactNumber(votes)} votes
      </div>
    </div>
  );
}

/**
 * The detail-page ratings stat card. Shows the TMDb score alone, or TMDb and
 * IMDb side by side when the title has an ingested IMDb rating — one card for
 * one kind of fact, instead of two near-identical star cards.
 */
export function RatingsCard({ score, voteCount, imdbRating }: RatingsCardProps) {
  return (
    <div className="rounded-lg bg-zinc-900 p-5">
      <Star className="mb-3 h-5 w-5 text-yellow-500" />
      <div className="flex gap-6">
        <RatingValue value={score} source="TMDB" votes={voteCount} />
        {imdbRating && (
          <RatingValue value={imdbRating.rating} source="IMDb" votes={imdbRating.numVotes} />
        )}
      </div>
    </div>
  );
}
