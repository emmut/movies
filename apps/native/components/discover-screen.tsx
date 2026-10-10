import type { DiscoveryInput } from '@movies/api/discover';
import type { MediaCard } from '@movies/api/home';
import { BottomNavigation } from '@native/components/bottom-navigation';
import { DiscoverFilters } from '@native/components/discover-filters';
import { MediaPoster } from '@native/components/media-poster';
import { orpc } from '@native/lib/api';
import { readDiscoverState } from '@native/lib/discover-state';
import { useRegion } from '@native/lib/preferences';
import { useRememberedScroll } from '@native/lib/use-remembered-scroll';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView as NativeSafeAreaView } from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';

const SafeAreaView = withUniwind(NativeSafeAreaView);
function renderCard({ item }: { item: MediaCard }) {
  return (
    <View className="flex-1 items-center pb-4">
      <MediaPoster item={item} />
    </View>
  );
}
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
  const { ref, onScroll, onLayout, onScrollBeginDrag, onContentSizeChange } = useRememberedScroll<
    FlatList<MediaCard>
  >('discover:' + JSON.stringify(input));
  if (query.isPending)
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator accessibilityLabel="Loading discovered titles" />
      </View>
    );
  if (query.isError)
    return (
      <View className="flex-1 items-start gap-3 p-5">
        <Text className="text-foreground">Couldn’t load discovered titles.</Text>
        <Pressable
          accessibilityRole="button"
          className="min-h-11 justify-center rounded-xl bg-default px-4"
          onPress={() => {
            void query.refetch();
          }}
        >
          <Text className="text-foreground">Try again</Text>
        </Pressable>
      </View>
    );
  const totalPages = Math.max(1, query.data.totalPages);
  return (
    <FlatList
      testID="discover-scroll"
      contentInsetAdjustmentBehavior="automatic"
      className="flex-1"
      ref={ref}
      data={query.data.items}
      renderItem={renderCard}
      keyExtractor={keyExtractor}
      numColumns={2}
      onScroll={onScroll}
      onLayout={onLayout}
      onScrollBeginDrag={onScrollBeginDrag}
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
              className="min-h-11 justify-center rounded-xl bg-default px-4"
              onPress={() => change({ page: String(input.page - 1) })}
            >
              <Text className="text-foreground">Previous page</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: input.page >= totalPages }}
              disabled={input.page >= totalPages}
              className="min-h-11 justify-center rounded-xl bg-default px-4"
              onPress={() => change({ page: String(input.page + 1) })}
            >
              <Text className="text-foreground">Next page</Text>
            </Pressable>
          </View>
        </View>
      }
    />
  );
}

export function DiscoverScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { region } = useRegion();
  const input = readDiscoverState(params, region);
  const options = useQuery(
    orpc.discovery.options.queryOptions({ input: { type: input.type, region: input.region } }),
  );
  function change(values: Record<string, string>) {
    router.setParams(values);
  }
  return (
    <SafeAreaView
      className="flex-1 bg-background"
      edges={['top', 'left', 'right']}
      collapsable={false}
    >
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
              className="min-h-11 justify-center rounded-xl border border-border bg-default px-4"
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
      <BottomNavigation />
    </SafeAreaView>
  );
}
