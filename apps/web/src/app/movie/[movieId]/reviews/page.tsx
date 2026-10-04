import { Suspense } from 'react';

import { ReviewsPageContent, ReviewsPageSkeleton } from '@/components/reviews-page-content';

type MovieReviewsPageProps = {
  params: Promise<{ movieId: string }>;
  searchParams: Promise<{ page?: string }>;
};

export default async function MovieReviewsPage(props: MovieReviewsPageProps) {
  const { movieId } = await props.params;
  const { page } = await props.searchParams;

  // Keyed by page so paginating re-suspends into the skeleton instead of
  // keeping the previous page's reviews on screen while the next one loads.
  return (
    <Suspense key={page} fallback={<ReviewsPageSkeleton />}>
      <ReviewsPageContent mediaType="movie" mediaId={Number(movieId)} page={Number(page ?? 1)} />
    </Suspense>
  );
}
