import type { DiscoveryInput } from '@movies/api/discover';
import type { MediaCard } from '@movies/api/home';
import { BottomNavigation } from '@native/components/bottom-navigation';
import { DiscoverFilters } from '@native/components/discover-filters';
import { MediaPoster } from '@native/components/media-poster';
import { ScreenQueryState } from '@native/components/screen-query-state';
import { ScrollNavigationProvider } from '@native/components/scroll-navigation';
import { orpc } from '@native/lib/api';
import { readDiscoverState } from '@native/lib/discover-state';
import { useRegion, useProviderPreferences } from '@native/lib/preferences';
import { combineQueryStates } from '@native/lib/query-state';
import { useRememberedScroll } from '@native/lib/use-remembered-scroll';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView as NativeSafeAreaView } from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';

const SafeAreaView = withUniwind(NativeSafeAreaView);
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
  const query = useQuery(orpc.discovery.list.queryOptions({ input }));
  const {
    ref,
    onScroll,
    onLayout,
    onScrollBeginDrag,
    onContentSizeChange,
    captureBeforeNavigation,
    cancelBeforeNavigation,
  } = useRememberedScroll<FlatList<MediaCard>>('discover:' + JSON.stringify(input));
  if (query.isPending || query.isError) {
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
      <FlatList
        testID="discover-scroll"
        contentInsetAdjustmentBehavior="automatic"
        className="flex-1"
        ref={ref}
        data={query.data.items}
        renderItem={({ item }) => (
          <View className="flex-1 items-center pb-4">
            <MediaPoster item={item} region={input.region} />
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
  const options = useQuery(
    orpc.discovery.options.queryOptions({ input: { type: input.type, region: input.region } }),
  );
  function change(values: Record<string, string>) {
    router.setParams(values);
  }
  return (
    <>
      <View className="gap-3 p-4">
        <Text accessibilityRole="header" className="text-2xl font-bold text-foreground">
          Discover
        </Text>
        <View className="flex-row gap-3">
          {(['movie', 'tv'] as const).map((type) => (
            <Pressable
              key={type}
              accessibilityRole="button"
              accessibilityLabel={type === 'movie' ? 'Movies' : 'TV Shows'}
              accessibilityState={{ selected: input.type === type }}
              className="bg-default min-h-11 justify-center rounded-xl border border-border px-4"
              onPress={() => change({ mediaType: type, genreId: '', sort_by: '', page: '1' })}
            >
              <Text className="font-semibold text-foreground">
                {type === 'movie' ? 'Movies' : 'TV Shows'}
              </Text>
            </Pressable>
          ))}
        </View>
        {options.data ? (
          <DiscoverFilters input={input} data={options.data} change={change} />
        ) : null}
        {options.isPending ? (
          <ActivityIndicator accessibilityLabel="Loading discovery filters" />
        ) : null}
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
    return <ScreenQueryState label="account preferences" failed={false} retry={() => {}} />;
  }
  if (preferences.session.error) {
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
  if (query.data && !state.pending && !state.error) {
    return <DiscoverContent userProviders={query.data.providerIds} />;
  }
  return (
    <ScreenQueryState
      label="account preferences"
      failed={Boolean(state.error)}
      retry={state.retry}
    />
  );
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
