import { Suspense } from 'react';

import { ReviewsPageContent, ReviewsPageSkeleton } from '@/components/reviews-page-content';

type TvReviewsPageProps = {
  params: Promise<{ tvId: string }>;
  searchParams: Promise<{ page?: string }>;
};

export default async function TvReviewsPage(props: TvReviewsPageProps) {
  const { tvId } = await props.params;
  const { page } = await props.searchParams;

  // Keyed by page so paginating re-suspends into the skeleton instead of
  // keeping the previous page's reviews on screen while the next one loads.
  return (
    <Suspense key={page} fallback={<ReviewsPageSkeleton />}>
      <ReviewsPageContent mediaType="tv" mediaId={Number(tvId)} page={Number(page ?? 1)} />
    </Suspense>
  );
}
