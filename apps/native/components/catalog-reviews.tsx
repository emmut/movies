import type { CatalogDetailInput } from '@movies/api/catalog';
import { CatalogSectionState } from '@native/components/catalog-section-state';
import { ReviewCard } from '@native/components/review-card';
import { useScrollNavigation } from '@native/components/scroll-navigation';
import { orpc } from '@native/lib/api';
import { catalogReviewsPath } from '@native/lib/catalog-navigation';
import { reviewCountLabel } from '@native/lib/review-model';
import { useQuery } from '@tanstack/react-query';
import { Link, usePathname } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

export function CatalogReviews({ input }: { input: CatalogDetailInput }) {
  const pathname = usePathname();
  const navigationPress = useScrollNavigation();
  const query = useQuery(
    orpc.catalog.reviews.queryOptions({
      input: { id: input.id, type: input.type, page: 1 },
      retry: false,
    }),
  );
  if (query.data?.reviews.length === 0) {
    return null;
  }
  return (
    <View className="gap-4">
      <Text accessibilityRole="header" className="text-xl font-semibold text-foreground">
        Reviews
        {query.data ? (
          <Text className="text-sm font-normal text-muted">
            {' '}
            ({query.data.totalResults.toLocaleString('en-US')})
          </Text>
        ) : null}
      </Text>
      <CatalogSectionState
        label="reviews"
        pending={query.isPending}
        failed={query.isError}
        retry={() => {
          void query.refetch();
        }}
      />
      {query.data?.reviews.slice(0, 3).map((review) => (
        <ReviewCard key={review.id} review={review} clamped />
      ))}
      {query.data && query.data.totalResults > 3 ? (
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
              View all {reviewCountLabel(query.data.totalResults)}
            </Text>
          </Pressable>
        </Link>
      ) : null}
    </View>
  );
}
