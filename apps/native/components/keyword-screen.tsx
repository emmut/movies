import type { MediaCard } from '@movies/api/home';
import { useCatalogKeyword } from '@movies/api/react/use-catalog-query';
import { BottomNavigation } from '@native/components/bottom-navigation';
import { CatalogSectionState } from '@native/components/catalog-section-state';
import { MediaPoster } from '@native/components/media-poster';
import { ScrollNavigationProvider } from '@native/components/scroll-navigation';
import { readKeywordInput } from '@native/lib/keyword-model';
import { useRegion } from '@native/lib/preferences';
import { useRememberedScroll } from '@native/lib/use-remembered-scroll';
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
  const query = useCatalogKeyword({ id, type, region, page });
  const title = query.data?.name ?? 'Themes & Keywords';
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
        <Stack.Screen options={{ title }} />
        <Text accessibilityRole="header" className="text-2xl font-bold text-foreground">
          {title}
        </Text>
        <KeywordMediaTypes
          type={type}
          change={(mediaType) => router.setParams({ mediaType, page: '1' })}
        />
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
            <KeywordPagination
              page={page}
              totalPages={query.data.totalPages}
              pending={query.isFetching}
              navigate={navigate}
            />
          </>
        ) : null}
      </ScrollView>
    </ScrollNavigationProvider>
  );
}
function KeywordResults({ items, region }: { items: MediaCard[]; region: string }) {
  if (items.length === 0) {
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
  const input = readKeywordInput(params, region);
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['left', 'right']}>
      {input.success ? (
        <KeywordQuery
          key={input.data.id + '-' + input.data.type + '-' + input.data.page}
          {...input.data}
        />
      ) : (
        <Text className="p-5 text-foreground">Keyword not found.</Text>
      )}
      <BottomNavigation />
    </SafeAreaView>
  );
}

const mediaTypeOptions = [
  { value: 'movie', label: 'Movies' },
  { value: 'tv', label: 'TV Shows' },
] as const;

function KeywordMediaTypes({
  type,
  change,
}: {
  type: 'movie' | 'tv';
  change: (type: 'movie' | 'tv') => void;
}) {
  return (
    <View className="flex-row gap-3">
      {mediaTypeOptions.map((option) => {
        const selected = type === option.value;
        const buttonColors = selected ? 'border-blue-500 bg-blue-700' : 'bg-default border-border';
        const textClass = selected ? 'font-semibold text-white' : 'text-foreground';
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => change(option.value)}
            className={`min-h-11 justify-center rounded-lg border px-4 ${buttonColors}`}
          >
            <Text className={textClass}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
function KeywordPagination({
  page,
  totalPages,
  pending,
  navigate,
}: {
  page: number;
  totalPages: number;
  pending: boolean;
  navigate: (page: number) => void;
}) {
  const previousDisabled = page <= 1 || pending;
  const nextDisabled = page >= totalPages || pending;
  return (
    <View className="flex-row items-center justify-between gap-3">
      <Pressable
        accessibilityRole="button"
        disabled={previousDisabled}
        accessibilityState={{ disabled: previousDisabled }}
        onPress={() => navigate(page - 1)}
        className="bg-default min-h-11 justify-center rounded-lg px-4 disabled:opacity-50"
      >
        <Text className="text-foreground">Previous</Text>
      </Pressable>
      <Text className="text-muted">
        Page {page} of {Math.max(1, totalPages)}
      </Text>
      <Pressable
        accessibilityRole="button"
        disabled={nextDisabled}
        accessibilityState={{ disabled: nextDisabled }}
        onPress={() => navigate(page + 1)}
        className="bg-default min-h-11 justify-center rounded-lg px-4 disabled:opacity-50"
      >
        <Text className="text-foreground">Next</Text>
      </Pressable>
    </View>
  );
}
