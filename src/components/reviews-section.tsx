import Link from 'next/link';

import { ReviewCard } from '@/components/review-card';
import { getMediaReviews } from '@/lib/media-info';

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
  const { reviews, totalResults } = await getMediaReviews(mediaType, mediaId);

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
