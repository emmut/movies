import { parseCatalogId } from '@movies/api/catalog';
import { regionSchema } from '@movies/config/regions';
import { BottomNavigation } from '@native/components/bottom-navigation';
import { CatalogSectionState } from '@native/components/catalog-section-state';
import { MediaPoster, MediaPosterRow } from '@native/components/media-poster';
import { ScrollNavigationProvider } from '@native/components/scroll-navigation';
import { orpc } from '@native/lib/api';
import { useRegion } from '@native/lib/preferences';
import { useRememberedScroll } from '@native/lib/use-remembered-scroll';
import { useQuery } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView as NativeSafeAreaView } from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';
const SafeAreaView = withUniwind(NativeSafeAreaView);
function KeywordQuery({
  id,
  type,
  region,
  page,
}: {
  id: number;
  type: 'movie' | 'tv';
  region: string;
  page: number;
}) {
  const router = useRouter();
  const {
    ref: scrollRef,
    onScroll,
    onContentSizeChange,
    onLayout,
    onScrollBeginDrag,
    captureBeforeNavigation,
    cancelBeforeNavigation,
  } = useRememberedScroll('keyword:' + id + ':' + type + ':' + page, 'entry');
  const query = useQuery(
    orpc.catalog.keyword.queryOptions({ input: { id, type, region, page }, retry: false }),
  );
  function navigate(next: number) {
    router.setParams({ page: String(next) });
  }
  return (
    <ScrollNavigationProvider capture={captureBeforeNavigation} cancel={cancelBeforeNavigation}>
      <ScrollView
        ref={scrollRef}
        onScroll={onScroll}
        onContentSizeChange={onContentSizeChange}
        onLayout={onLayout}
        onScrollBeginDrag={onScrollBeginDrag}
        onTouchMove={onScrollBeginDrag}
        scrollEventThrottle={16}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="gap-6 px-4 pt-4 pb-12"
      >
        <Stack.Screen options={{ title: query.data?.name ?? 'Themes & Keywords' }} />
        <Text accessibilityRole="header" className="text-2xl font-bold text-foreground">
          {query.data?.name ?? 'Themes & Keywords'}
        </Text>
        <View className="flex-row gap-3">
          {(['movie', 'tv'] as const).map((option) => (
            <Pressable
              key={option}
              accessibilityRole="button"
              accessibilityState={{ selected: type === option }}
              onPress={() => router.setParams({ mediaType: option, page: '1' })}
              className={`min-h-11 justify-center rounded-lg border px-4 ${type === option ? 'border-blue-500 bg-blue-700' : 'bg-default border-border'}`}
            >
              <Text className={type === option ? 'font-semibold text-white' : 'text-foreground'}>
                {option === 'movie' ? 'Movies' : 'TV Shows'}
              </Text>
            </Pressable>
          ))}
        </View>
        <CatalogSectionState
          label="keyword titles"
          pending={query.isPending}
          failed={query.isError}
          retry={() => {
            void query.refetch();
          }}
        />
        {query.data ? (
          <>
            <KeywordResults items={query.data.items} region={region} />
            <View className="flex-row items-center justify-between gap-3">
              <Pressable
                accessibilityRole="button"
                disabled={page <= 1 || query.isFetching}
                accessibilityState={{ disabled: page <= 1 || query.isFetching }}
                onPress={() => navigate(page - 1)}
                className="bg-default min-h-11 justify-center rounded-lg px-4 disabled:opacity-50"
              >
                <Text className="text-foreground">Previous</Text>
              </Pressable>
              <Text className="text-muted">
                Page {page} of {Math.max(1, query.data.totalPages)}
              </Text>
              <Pressable
                accessibilityRole="button"
                disabled={page >= query.data.totalPages || query.isFetching}
                accessibilityState={{ disabled: page >= query.data.totalPages || query.isFetching }}
                onPress={() => navigate(page + 1)}
                className="bg-default min-h-11 justify-center rounded-lg px-4 disabled:opacity-50"
              >
                <Text className="text-foreground">Next</Text>
              </Pressable>
            </View>
          </>
        ) : null}
      </ScrollView>
    </ScrollNavigationProvider>
  );
}
function KeywordResults({
  items,
  region,
}: {
  items: Parameters<typeof MediaPosterRow>[0]['items'];
  region: string;
}) {
  if (!items.length) {
    return <Text className="text-muted">No titles found.</Text>;
  }
  return (
    <View className="flex-row flex-wrap justify-between gap-y-5">
      {items.map((item) => (
        <MediaPoster key={item.id} item={item} region={region} />
      ))}
    </View>
  );
}
export function KeywordScreen() {
  const params = useLocalSearchParams<{
    keywordId?: string;
    mediaType?: string;
    region?: string;
    page?: string;
  }>();
  const region = useRegion();
  const id = parseCatalogId(params.keywordId);
  const page = params.page === undefined ? 1 : parseCatalogId(params.page);
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['left', 'right']}>
      {id &&
      page &&
      page <= 500 &&
      (params.mediaType === undefined ||
        params.mediaType === 'movie' ||
        params.mediaType === 'tv') ? (
        <KeywordQuery
          key={id + '-' + (params.mediaType ?? 'movie') + '-' + page}
          id={id}
          type={params.mediaType === 'tv' ? 'tv' : 'movie'}
          region={regionSchema.safeParse(params.region).data ?? region}
          page={page}
        />
      ) : (
        <Text className="p-5 text-foreground">Keyword not found.</Text>
      )}
      <BottomNavigation />
    </SafeAreaView>
  );
}
