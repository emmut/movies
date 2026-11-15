import type { CatalogDetailInput } from '@movies/api/catalog';
import { useCatalogReviews } from '@movies/api/react/use-catalog-query';
import type { ReviewsPage } from '@movies/api/reviews';
import { CatalogSectionState } from '@native/components/catalog-section-state';
import { ReviewCard } from '@native/components/review-card';
import { useScrollNavigation } from '@native/components/scroll-navigation';
import { catalogReviewsPath } from '@native/lib/catalog-navigation';
import { reviewCountLabel } from '@native/lib/review-model';
import { Link, usePathname } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

export function CatalogReviews({ input }: { input: CatalogDetailInput }) {
  const query = useCatalogReviews({ id: input.id, type: input.type, page: 1 });
  if (query.data?.reviews.length === 0) {
    return null;
  }
  return (
    <View className="gap-4">
      <ReviewHeading count={query.data?.totalResults} />
      <CatalogSectionState
        label="reviews"
        pending={query.isPending}
        failed={query.isError}
        retry={() => {
          void query.refetch();
        }}
      />
      {query.data ? <ReviewPreview data={query.data} input={input} /> : null}
    </View>
  );
}

function ReviewPreview({ data, input }: { data: ReviewsPage; input: CatalogDetailInput }) {
  const pathname = usePathname();
  const navigationPress = useScrollNavigation();
  return (
    <>
      {data.reviews.slice(0, 3).map((review) => (
        <ReviewCard key={review.id} review={review} clamped />
      ))}
      {data.totalResults > 3 ? (
        <Link
          href={{
            pathname: catalogReviewsPath(pathname),
            params: { id: input.id, type: input.type, region: input.region },
          }}
          asChild
        >
          <Pressable
            {...navigationPress}
            accessibilityRole="link"
            className="bg-default min-h-11 justify-center self-start rounded-lg border border-border px-4 py-2"
          >
            <Text className="text-sm text-foreground">
              View all {reviewCountLabel(data.totalResults)}
            </Text>
          </Pressable>
        </Link>
      ) : null}
    </>
  );
}

function ReviewHeading({ count }: { count?: number }) {
  return (
    <Text accessibilityRole="header" className="text-xl font-semibold text-foreground">
      Reviews
      {count !== undefined ? (
        <Text className="text-sm font-normal text-muted"> ({count.toLocaleString('en-US')})</Text>
      ) : null}
    </Text>
  );
}
