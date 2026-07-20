import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import { PaginationControls } from '@/components/pagination-controls';
import { ReviewCard } from '@/components/review-card';
import { Skeleton } from '@/components/ui/skeleton';
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
    <div id="content" className="mx-auto min-h-screen max-w-3xl scroll-m-5">
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

/**
 * Loading skeleton mirroring {@link ReviewsPageContent}; used both as the
 * route's initial fallback and, keyed by page, while paginating. Carries
 * `id="content"` so the pagination scroll has a target mid-load.
 */
export function ReviewsPageSkeleton() {
  return (
    // h-screen + overflow-clip: cards are sized like real reviews, so the
    // tail card overflows the viewport — clip it instead of letting the
    // stack squish or grow the document past the scroll target.
    <div id="content" className="mx-auto h-screen max-w-3xl overflow-clip scroll-m-5">
      <Skeleton className="mb-6 h-5 w-40" />

      <h1 className="mb-1 text-3xl font-bold">Reviews</h1>
      <Skeleton className="mb-6 h-4 w-56" />

      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2 rounded-lg bg-zinc-900 p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-16" />
            </div>
            {Array.from({ length: 7 }).map((_, line) => (
              <Skeleton key={line} className="h-4 w-full" />
            ))}
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}
