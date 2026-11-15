import { parseCatalogId } from '@movies/api/catalog';
import { seasonNumberParam, type SeasonPage } from '@movies/api/pdp';
import { useCatalogSeason } from '@movies/api/react/use-catalog-query';
import { BottomNavigation } from '@native/components/bottom-navigation';
import { CatalogSectionState } from '@native/components/catalog-section-state';
import { PdpImage } from '@native/components/pdp-image';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView as NativeSafeAreaView } from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';

const SafeAreaView = withUniwind(NativeSafeAreaView);

type Episode = SeasonPage['episodes'][number];

function toggleId(ids: number[], id: number) {
  if (ids.includes(id)) {
    return ids.filter((value) => value !== id);
  }
  return [...ids, id];
}

function ratingLabel(episode: Episode) {
  if (episode.vote_count === 0) {
    return 'Not yet rated';
  }
  return episode.vote_average.toFixed(1) + '/10 (' + episode.vote_count + ' votes)';
}

function Episodes({ data }: { data: SeasonPage }) {
  const [revealedEpisodeIds, setRevealedEpisodeIds] = useState<number[]>([]);
  const allEpisodesRevealed =
    data.episodes.length > 0 &&
    data.episodes.every((episode) => revealedEpisodeIds.includes(episode.id));
  function toggleEpisode(episodeId: number) {
    setRevealedEpisodeIds((currentIds) => toggleId(currentIds, episodeId));
  }

  function toggleAllEpisodes() {
    if (allEpisodesRevealed) {
      setRevealedEpisodeIds([]);
      return;
    }

    const episodeIds = data.episodes.map((episode) => episode.id);
    setRevealedEpisodeIds(episodeIds);
  }

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
        onPress={toggleAllEpisodes}
        className="bg-default min-h-11 justify-center self-start rounded-lg border border-border px-4"
      >
        <Text className="font-semibold text-foreground">
          {allEpisodesRevealed ? 'Hide spoilers' : 'Show spoilers'}
        </Text>
      </Pressable>
      {data.episodes.length === 0 ? (
        <Text className="text-muted">No episodes available.</Text>
      ) : null}
      {data.episodes.map((episode) => (
        <EpisodeCard
          key={episode.id}
          episode={episode}
          visible={revealedEpisodeIds.includes(episode.id)}
          toggle={() => toggleEpisode(episode.id)}
        />
      ))}
    </View>
  );
}

function SeasonQuery({ id, season }: { id: number; season: number }) {
  const query = useCatalogSeason({ id, season });
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
  const season = seasonNumberParam.safeParse(params.season);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['left', 'right']}>
      {id && params.type === 'tv' && season.success ? (
        <SeasonQuery id={id} season={season.data} />
      ) : (
        <Text className="p-5 text-foreground">Season not found.</Text>
      )}
      <BottomNavigation />
    </SafeAreaView>
  );
}

function EpisodeCard({
  episode,
  visible,
  toggle,
}: {
  episode: Episode;
  visible: boolean;
  toggle: () => void;
}) {
  const action = visible ? 'Hide' : 'Reveal';
  return (
    <View className="overflow-hidden rounded-xl border border-border bg-background">
      <View className="bg-default aspect-video items-center justify-center">
        {visible ? (
          <PdpImage path={episode.still_path} title={episode.name} />
        ) : (
          <Text className="text-muted">Episode details hidden</Text>
        )}
      </View>
      <View className="gap-3 p-4">
        <EpisodeHeading episode={episode} visible={visible} />
        <EpisodeStats episode={episode} />
        <EpisodeOverview episode={episode} visible={visible} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={action + ' episode ' + episode.episode_number}
          accessibilityState={{ expanded: visible }}
          onPress={toggle}
          className="bg-default min-h-11 justify-center self-start rounded-lg px-4"
        >
          <Text className="font-semibold text-foreground">{action + ' details'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function EpisodeHeading({ episode, visible }: { episode: Episode; visible: boolean }) {
  return (
    <>
      <Text className="text-xs text-muted">{episode.air_date || 'Air date TBA'}</Text>
      <Text accessibilityRole="header" className="text-lg font-semibold text-foreground">
        {visible ? episode.name : 'Episode ' + episode.episode_number}
      </Text>
    </>
  );
}

function EpisodeStats({ episode }: { episode: Episode }) {
  return (
    <View className="flex-row flex-wrap gap-3">
      {episode.runtime ? <Text className="text-xs text-muted">{episode.runtime} min</Text> : null}
      <Text className="text-xs text-muted">{ratingLabel(episode)}</Text>
    </View>
  );
}

function EpisodeOverview({ episode, visible }: { episode: Episode; visible: boolean }) {
  if (!visible) {
    return null;
  }
  return (
    <Text className="text-base leading-6 text-foreground">
      {episode.overview || 'No overview available.'}
    </Text>
  );
}
