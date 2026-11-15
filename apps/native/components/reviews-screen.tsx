import { useCatalogDetails, useCatalogReviews } from '@movies/api/react/use-catalog-query';
import type { Review, ReviewsInput, ReviewsPage } from '@movies/api/reviews';
import { BottomNavigation } from '@native/components/bottom-navigation';
import { CatalogPagination } from '@native/components/catalog-pagination';
import { ReviewCard } from '@native/components/review-card';
import { ScreenQueryState } from '@native/components/screen-query-state';
import { catalogPath } from '@native/lib/catalog-navigation';
import { useRegion } from '@native/lib/preferences';
import { readReviewsInput, reviewCountLabel } from '@native/lib/review-model';
import { regionOr } from '@native/lib/search-params';
import { useRememberedScroll } from '@native/lib/use-remembered-scroll';
import { Link, Stack, useLocalSearchParams, usePathname, useRouter } from 'expo-router';
import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView as NativeSafeAreaView } from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';

const SafeAreaView = withUniwind(NativeSafeAreaView);

function Separator() {
  return <View className="h-4" />;
}

function ReviewsResults({ input, region }: { input: ReviewsInput; region: string }) {
  const query = useCatalogReviews(input);
  const details = useCatalogDetails({ id: input.id, type: input.type, region });
  if (query.isPending || query.isError) {
    return (
      <ScreenQueryState
        label="reviews"
        failed={query.isError}
        retry={() => {
          void query.refetch();
        }}
      />
    );
  }
  return <ReviewList input={input} region={region} data={query.data} title={details.data?.title} />;
}

function ReviewList({
  input,
  region,
  data,
  title,
}: {
  input: ReviewsInput;
  region: string;
  title?: string;
  data: ReviewsPage;
}) {
  const titleLabel = title || 'this title';
  const router = useRouter();
  const pathname = usePathname();
  const { ref, onScroll, onLayout, onContentSizeChange, onScrollBeginDrag } = useRememberedScroll<
    FlatList<Review>
  >('reviews:' + input.type + ':' + input.id + ':' + input.page, 'entry');
  return (
    <FlatList
      testID="reviews-scroll"
      ref={ref}
      data={data.reviews}
      keyExtractor={(review) => review.id}
      renderItem={({ item }) => <ReviewCard review={item} />}
      ItemSeparatorComponent={Separator}
      onScroll={onScroll}
      onLayout={onLayout}
      onContentSizeChange={onContentSizeChange}
      onScrollBeginDrag={onScrollBeginDrag}
      onTouchMove={onScrollBeginDrag}
      scrollEventThrottle={16}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName="p-4 pb-12"
      ListHeaderComponent={
        <View className="mb-6 gap-3">
          <Link
            dismissTo
            href={{
              pathname: catalogPath(pathname),
              params: { id: input.id, type: input.type, region },
            }}
            asChild
          >
            <Pressable accessibilityRole="link" className="min-h-11 justify-center self-start">
              <Text className="text-sm text-muted">← Back to {titleLabel}</Text>
            </Pressable>
          </Link>
          <Text accessibilityRole="header" className="text-3xl font-bold text-foreground">
            Reviews
          </Text>
          <Text className="text-sm text-muted">
            {reviewCountLabel(data.totalResults)} of {titleLabel} from TMDb
          </Text>
        </View>
      }
      ListEmptyComponent={
        <Text className="py-4 text-muted">
          {data.totalResults === 0 ? 'No reviews yet.' : 'No reviews on this page.'}
        </Text>
      }
      ListFooterComponent={
        data.totalPages > 1 ? (
          <CatalogPagination
            page={data.page}
            totalPages={data.totalPages}
            onChange={(page) => router.setParams({ page: String(page) })}
          />
        ) : undefined
      }
    />
  );
}

export function ReviewsScreen() {
  const params = useLocalSearchParams<{
    id?: string;
    type?: string;
    page?: string;
    region?: string;
  }>();
  const region = useRegion();
  const input = readReviewsInput(params);
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['left', 'right']} collapsable={false}>
      <Stack.Screen options={{ title: 'Reviews' }} />
      {input.success ? (
        <ReviewsResults input={input.data} region={regionOr(params.region, region)} />
      ) : (
        <View className="flex-1 items-start gap-3 p-5">
          <Text accessibilityRole="header" className="text-xl font-semibold text-foreground">
            Invalid title
          </Text>
          <Text className="text-muted">Reviews require a valid movie or TV show.</Text>
        </View>
      )}
      <BottomNavigation />
    </SafeAreaView>
  );
}
