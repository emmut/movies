import { ReviewsPageContent } from '@/components/reviews-page-content';

type MovieReviewsPageProps = {
  params: Promise<{ movieId: string }>;
  searchParams: Promise<{ page?: string }>;
};

export default async function MovieReviewsPage(props: MovieReviewsPageProps) {
  const { movieId } = await props.params;
  const { page } = await props.searchParams;

  return <ReviewsPageContent mediaType="movie" mediaId={Number(movieId)} page={Number(page ?? 1)} />;
}
