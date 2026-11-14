import type { DiscoveryInput } from '@movies/api/discover';
import type { MediaCard } from '@movies/api/home';
import { BottomNavigation } from '@native/components/bottom-navigation';
import { DiscoverFacetChips } from '@native/components/discover-facet-chips';
import { DiscoverFilters } from '@native/components/discover-filters';
import {
  DiscoverSkeleton,
  PosterGridSkeleton,
  Skeleton,
} from '@native/components/loading-skeletons';
import { MediaPoster } from '@native/components/media-poster';
import { MediaTypeTabs } from '@native/components/media-type-tabs';
import { ScreenQueryState } from '@native/components/screen-query-state';
import { ScrollNavigationProvider } from '@native/components/scroll-navigation';
import { useDiscoveryList, useDiscoveryOptions } from '@native/hooks/use-discovery-query';
import { readDiscoverState } from '@native/lib/discover-state';
import { hasDiscoverySessionError } from '@native/lib/discovery-session';
import { useRegion, useProviderPreferences } from '@native/lib/preferences';
import { combineQueryStates } from '@native/lib/query-state';
import { useRememberedScroll } from '@native/lib/use-remembered-scroll';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView as NativeSafeAreaView } from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';

const SafeAreaView = withUniwind(NativeSafeAreaView);
const DiscoveryList = withUniwind(FlatList<MediaCard>);

function keyExtractor(item: MediaCard) {
  return item.type + ':' + item.id;
}

function DiscoveryResults({
  input,
  change,
}: {
  input: DiscoveryInput;
  change: (params: Record<string, string>) => void;
}) {
  const query = useDiscoveryList(input);
  const {
    ref,
    onScroll,
    onLayout,
    onScrollBeginDrag,
    onContentSizeChange,
    captureBeforeNavigation,
    cancelBeforeNavigation,
  } = useRememberedScroll<FlatList<MediaCard>>('discover:' + JSON.stringify(input));
  if (query.isPending) {
    return <PosterGridSkeleton label="Loading discovered titles" />;
  }
  if (query.isError) {
    return (
      <ScreenQueryState
        label="discovered titles"
        failed={query.isError}
        retry={() => {
          void query.refetch();
        }}
      />
    );
  }
  const totalPages = Math.max(1, query.data.totalPages);
  return (
    <ScrollNavigationProvider capture={captureBeforeNavigation} cancel={cancelBeforeNavigation}>
      <DiscoveryList
        testID="discover-scroll"
        contentInsetAdjustmentBehavior="automatic"
        className="flex-1"
        contentContainerClassName="px-2"
        ref={ref}
        data={query.data.items}
        renderItem={({ item }) => (
          <View className="w-1/2 px-2 pb-4">
            <MediaPoster item={item} region={input.region} fluid />
          </View>
        )}
        keyExtractor={keyExtractor}
        numColumns={2}
        onScroll={onScroll}
        onLayout={onLayout}
        onScrollBeginDrag={onScrollBeginDrag}
        onTouchMove={onScrollBeginDrag}
        onContentSizeChange={onContentSizeChange}
        scrollEventThrottle={16}
        ListEmptyComponent={<Text className="p-5 text-muted">No titles match these filters.</Text>}
        ListFooterComponent={
          <View className="items-center gap-3 p-4">
            <Text className="text-muted">
              {query.data.totalResults} results · Page {input.page} of {totalPages}
            </Text>
            <View className="flex-row gap-4">
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: input.page <= 1 }}
                disabled={input.page <= 1}
                className="bg-default min-h-11 justify-center rounded-xl px-4"
                onPress={() => change({ page: String(input.page - 1) })}
              >
                <Text className="text-foreground">Previous page</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: input.page >= totalPages }}
                disabled={input.page >= totalPages}
                className="bg-default min-h-11 justify-center rounded-xl px-4"
                onPress={() => change({ page: String(input.page + 1) })}
              >
                <Text className="text-foreground">Next page</Text>
              </Pressable>
            </View>
          </View>
        }
      />
    </ScrollNavigationProvider>
  );
}

function DiscoverContent({ userProviders }: { userProviders: number[] }) {
  const params = useLocalSearchParams();
  const router = useRouter();
  const region = useRegion();
  const input = readDiscoverState(params, region, userProviders);
  const options = useDiscoveryOptions({ type: input.type, region: input.region });
  function change(values: Record<string, string>) {
    router.setParams(values);
  }
  return (
    <>
      <View className="z-10 gap-3 p-4">
        <Text accessibilityRole="header" className="text-2xl font-bold text-foreground">
          Discover
        </Text>
        <View className="flex-row items-center justify-between gap-2">
          <View className="max-w-56 flex-1">
            <MediaTypeTabs
              label="Discover media type"
              value={input.type}
              options={[
                { value: 'movie', label: 'Movies' },
                { value: 'tv', label: 'TV Shows' },
              ]}
              onChange={(type) =>
                change({ mediaType: type, genreId: '', networkId: '', sort_by: '', page: '1' })
              }
            />
          </View>
          {options.data ? (
            <DiscoverFilters input={input} data={options.data} change={change} />
          ) : (
            <View accessibilityLabel="Loading discovery filters">
              <Skeleton className="h-11 w-24 rounded-xl" />
            </View>
          )}
        </View>
        <DiscoverFacetChips input={input} change={change} />
        {options.isError ? (
          <Pressable
            accessibilityRole="button"
            className="min-h-11 justify-center"
            onPress={() => {
              void options.refetch();
            }}
          >
            <Text className="text-foreground">Couldn’t load filters. Try again.</Text>
          </Pressable>
        ) : null}
      </View>
      <DiscoveryResults key={JSON.stringify(input)} input={input} change={change} />
    </>
  );
}

function AccountDiscovery() {
  const preferences = useProviderPreferences();
  if (preferences.session.isPending) {
    return <DiscoverSkeleton />;
  }
  if (hasDiscoverySessionError(preferences.session)) {
    return (
      <ScreenQueryState
        label="account preferences"
        failed
        retry={() => {
          void preferences.session.refetch();
        }}
      />
    );
  }
  if (!preferences.signedIn) {
    return <DiscoverContent userProviders={[]} />;
  }
  return <AuthenticatedDiscovery preferences={preferences} />;
}

function AuthenticatedDiscovery({
  preferences,
}: {
  preferences: ReturnType<typeof useProviderPreferences>;
}) {
  const { query, accountRegion } = preferences;
  const state = combineQueryStates([query, accountRegion]);
  if (state.pending) {
    return <DiscoverSkeleton />;
  }
  if (state.error) {
    return <ScreenQueryState label="account preferences" failed retry={state.retry} />;
  }
  if (query.data) {
    return <DiscoverContent userProviders={query.data.providerIds} />;
  }
  return <DiscoverSkeleton />;
}

export function DiscoverScreen() {
  return (
    <SafeAreaView
      className="flex-1 bg-background"
      edges={['top', 'left', 'right']}
      collapsable={false}
    >
      <AccountDiscovery />
      <BottomNavigation />
    </SafeAreaView>
  );
}
