import { Star } from 'lucide-react';

import { ExpandableText } from '@/components/expandable-text';
import type { TmdbReview } from '@/types/review';

type ReviewCardProps = {
  review: TmdbReview;
  clamped?: boolean;
};

const dateFormatter = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' });

const CONTENT_CLASS = 'text-sm leading-relaxed whitespace-pre-line text-zinc-300';

function formatDate(dateString: string) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return null;
  return dateFormatter.format(date);
}

/**
 * A single TMDb user review: author, optional star rating, date, and content.
 *
 * @param review - The review to render.
 * @param clamped - When true, truncates the content to a few lines with a
 *   "Show more" toggle (used in the detail-page teaser; the all-reviews page
 *   shows the full text directly).
 */
export function ReviewCard({ review, clamped = false }: ReviewCardProps) {
  return (
    <div className="space-y-2 rounded-lg bg-zinc-900 p-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="font-medium">{review.author}</span>
        {review.author_details.rating !== null && (
          <span className="flex items-center gap-1 text-sm text-zinc-300">
            <Star className="h-4 w-4 text-yellow-500" />
            {review.author_details.rating}/10
          </span>
        )}
        <span className="text-xs text-zinc-500">{formatDate(review.created_at)}</span>
      </div>
      {clamped ? (
        <ExpandableText text={review.content} className={CONTENT_CLASS} />
      ) : (
        <p className={CONTENT_CLASS}>{review.content}</p>
      )}
      <a
        href={review.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block text-sm text-zinc-400 underline hover:text-white"
      >
        Read on TMDb
      </a>
    </div>
  );
}
