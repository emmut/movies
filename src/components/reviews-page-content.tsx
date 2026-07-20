import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import { PaginationControls } from '@/components/pagination-controls';
import { ReviewCard } from '@/components/review-card';
import { getMediaReviews } from '@/lib/media-info';
import { getMovieDetails } from '@/lib/movies';
import { getTvShowDetails } from '@/lib/tv-shows';

type ReviewsPageContentProps = {
  mediaType: 'movie' | 'tv';
  mediaId: number;
  page: number;
};

function sanitizePage(page: number) {
  return Number.isInteger(page) && page >= 1 ? page : 1;
}

async function getMediaTitle(mediaType: 'movie' | 'tv', mediaId: number) {
  if (mediaType === 'movie') {
    const movie = await getMovieDetails(mediaId);
    return movie.title;
  }
  const tvShow = await getTvShowDetails(mediaId);
  return tvShow.name;
}

/**
 * The full paginated reviews listing for a movie or TV show, shared by the
 * /movie/[id]/reviews and /tv/[id]/reviews routes.
 *
 * @param mediaType - Whether the media is a 'movie' or 'tv' show.
 * @param mediaId - The TMDb ID of the title.
 * @param page - The requested 1-based page; invalid values fall back to 1.
 */
export async function ReviewsPageContent({ mediaType, mediaId, page }: ReviewsPageContentProps) {
  const [title, { reviews, totalResults, totalPages }] = await Promise.all([
    getMediaTitle(mediaType, mediaId),
    getMediaReviews(mediaType, mediaId, sanitizePage(page)),
  ]);

  return (
    <div id="content-container" className="mx-auto min-h-screen max-w-3xl scroll-m-5">
      <Link
        href={`/${mediaType}/${mediaId}`}
        className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to {title}
      </Link>

      <h1 className="mb-1 text-3xl font-bold">Reviews</h1>
      <p className="mb-6 text-sm text-zinc-400">
        {totalResults} reviews of {title} from TMDb
      </p>

      {reviews.length === 0 ? (
        <p className="text-zinc-400">No reviews on this page.</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}

      <PaginationControls totalPages={totalPages} />
    </div>
  );
}
