import Link from 'next/link';

import { ReviewCard } from '@/components/review-card';
import { Skeleton } from '@/components/ui/skeleton';
import { getMediaReviews } from '@/lib/media-info';
import { optional } from '@/lib/tmdb';

type ReviewsSectionProps = {
  mediaType: 'movie' | 'tv';
  mediaId: number;
};

const MAX_REVIEWS = 3;

/**
 * Fetches and renders the latest TMDb user reviews for a movie or TV show,
 * with a link to the full paginated reviews page. Renders nothing when the
 * title has no reviews.
 *
 * @param mediaType - Whether the media is a 'movie' or 'tv' show.
 * @param mediaId - The TMDb ID of the title.
 */
export async function ReviewsSection({ mediaType, mediaId }: ReviewsSectionProps) {
  // Reviews are a non-essential section — a flaky TMDb response must degrade to
  // "no reviews" rather than take the whole detail page down with it.
  const { reviews, totalResults } = await optional(getMediaReviews(mediaType, mediaId), {
    reviews: [],
    totalResults: 0,
    totalPages: 0,
  });

  if (reviews.length === 0) {
    return null;
  }

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">
        Reviews <span className="text-sm font-normal text-zinc-400">({totalResults})</span>
      </h2>
      <div className="space-y-4">
        {reviews.slice(0, MAX_REVIEWS).map((review) => (
          <ReviewCard key={review.id} review={review} clamped />
        ))}
      </div>
      {totalResults > MAX_REVIEWS && (
        <Link
          href={`/${mediaType}/${mediaId}/reviews`}
          className="mt-4 inline-block text-sm text-zinc-400 underline hover:text-white"
        >
          View all {totalResults} reviews
        </Link>
      )}
    </div>
  );
}

/** Placeholder shown while {@link ReviewsSection} streams in. */
export function ReviewsSectionSkeleton() {
  return (
    <div>
      <Skeleton className="mb-4 h-7 w-40" />
      <div className="space-y-4">
        {Array.from({ length: 2 }).map((_, index) => (
          <Skeleton key={index} className="h-28 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}
