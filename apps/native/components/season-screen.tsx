import { parseCatalogId } from '@movies/api/catalog';
import type { SeasonPage } from '@movies/api/pdp';
import { BottomNavigation } from '@native/components/bottom-navigation';
import { CatalogSectionState } from '@native/components/catalog-section-state';
import { PdpImage } from '@native/components/pdp-media';
import { orpc } from '@native/lib/api';
import { useQuery } from '@tanstack/react-query';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView as NativeSafeAreaView } from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';
const SafeAreaView = withUniwind(NativeSafeAreaView);
function Episodes({ data }: { data: SeasonPage }) {
  const [revealed, setRevealed] = useState<number[]>([]);
  const all =
    data.episodes.length > 0 && data.episodes.every((episode) => revealed.includes(episode.id));
  return (
    <View className="gap-6">
      <View className="bg-default gap-3 rounded-2xl border border-border p-6">
        <Text className="text-xs text-muted">Season guide</Text>
        <Text accessibilityRole="header" className="text-3xl font-bold text-foreground">
          {data.name}
        </Text>
        <Text className="text-sm text-muted">
          {data.episodes.length} episodes · Browse the season at your own pace.
        </Text>
      </View>
      <Text accessibilityRole="header" className="text-xl font-semibold text-foreground">
        Episodes ({data.episodes.length})
      </Text>
      <Text className="text-sm text-muted">
        Titles, images, and descriptions are hidden to avoid spoilers.
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => setRevealed(all ? [] : data.episodes.map((episode) => episode.id))}
        className="bg-default min-h-11 justify-center self-start rounded-lg border border-border px-4"
      >
        <Text className="font-semibold text-foreground">
          {all ? 'Hide spoilers' : 'Show spoilers'}
        </Text>
      </Pressable>
      {!data.episodes.length ? <Text className="text-muted">No episodes available.</Text> : null}
      {data.episodes.map((episode) => {
        const visible = revealed.includes(episode.id);
        return (
          <View
            key={episode.id}
            className="overflow-hidden rounded-xl border border-border bg-background"
          >
            <View className="aspect-video items-center justify-center bg-zinc-900">
              {visible ? (
                <PdpImage path={episode.still_path} title={episode.name} />
              ) : (
                <Text className="text-zinc-300">Episode details hidden</Text>
              )}
            </View>
            <View className="gap-3 p-4">
              <Text className="text-xs text-muted">{episode.air_date || 'Air date TBA'}</Text>
              <Text accessibilityRole="header" className="text-lg font-semibold text-foreground">
                {visible ? episode.name : 'Episode ' + episode.episode_number}
              </Text>
              <View className="flex-row flex-wrap gap-3">
                {episode.runtime ? (
                  <Text className="text-xs text-muted">{episode.runtime} min</Text>
                ) : null}
                <Text className="text-xs text-muted">
                  {episode.vote_count > 0
                    ? episode.vote_average.toFixed(1) + '/10 (' + episode.vote_count + ' votes)'
                    : 'Not yet rated'}
                </Text>
              </View>
              {visible ? (
                <Text className="text-base leading-6 text-foreground">
                  {episode.overview || 'No overview available.'}
                </Text>
              ) : null}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  (visible ? 'Hide' : 'Reveal') + ' episode ' + episode.episode_number
                }
                accessibilityState={{ expanded: visible }}
                onPress={() =>
                  setRevealed((ids) =>
                    visible ? ids.filter((id) => id !== episode.id) : [...ids, episode.id],
                  )
                }
                className="bg-default min-h-11 justify-center self-start rounded-lg px-4"
              >
                <Text className="font-semibold text-foreground">
                  {visible ? 'Hide details' : 'Reveal details'}
                </Text>
              </Pressable>
            </View>
          </View>
        );
      })}
    </View>
  );
}
function SeasonQuery({ id, season }: { id: number; season: number }) {
  const query = useQuery(orpc.catalog.season.queryOptions({ input: { id, season }, retry: false }));
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName="gap-5 p-4 pb-12"
    >
      <CatalogSectionState
        label="season"
        pending={query.isPending}
        failed={query.isError}
        retry={() => {
          void query.refetch();
        }}
      />
      {query.data ? (
        <>
          <Stack.Screen options={{ title: query.data.name }} />
          <Episodes key={id + ':' + season} data={query.data} />
        </>
      ) : null}
    </ScrollView>
  );
}
export function SeasonScreen() {
  const params = useLocalSearchParams<{ id?: string; type?: string; season?: string }>();
  const id = parseCatalogId(params.id);
  const validSeason =
    typeof params.season === 'string' &&
    /^(0|[1-9]\d*)$/.test(params.season) &&
    Number(params.season) <= 10000;
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['left', 'right']}>
      {id && params.type === 'tv' && validSeason ? (
        <SeasonQuery id={id} season={Number(params.season)} />
      ) : (
        <Text className="p-5 text-foreground">Season not found.</Text>
      )}
      <BottomNavigation />
    </SafeAreaView>
  );
}
