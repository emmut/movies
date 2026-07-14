import { ReviewsPageContent } from '@/components/reviews-page-content';

type TvReviewsPageProps = {
  params: Promise<{ tvId: string }>;
  searchParams: Promise<{ page?: string }>;
};

export default async function TvReviewsPage(props: TvReviewsPageProps) {
  const { tvId } = await props.params;
  const { page } = await props.searchParams;

  return <ReviewsPageContent mediaType="tv" mediaId={Number(tvId)} page={Number(page ?? 1)} />;
}
