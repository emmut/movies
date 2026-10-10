import type { MediaCard, HomeMediaSection } from '@movies/api/home';
import { useQuery } from '@tanstack/react-query';
import { Image as ExpoImage } from 'expo-image';
import { memo } from 'react';
import { Alert, FlatList, Linking, Pressable, Text, View } from 'react-native';
import { withUniwind } from 'uniwind';

import { orpc } from '../lib/api';
import { webUrl } from '../lib/connections';

const Image = withUniwind(ExpoImage);

function keyExtractor(item: MediaCard) {
  return `${item.type}-${item.id}`;
}
async function openTitle(item: MediaCard) {
  await Linking.openURL(`${webUrl}/${item.type}/${item.id}`);
}
function CardImage({ item, featured }: { item: MediaCard; featured: boolean }) {
  const source = featured ? item.backdropUrl : item.posterUrl;
  return (
    <View
      className={`items-center justify-center overflow-hidden rounded-xl bg-zinc-800 ${featured ? 'h-50 w-full' : 'h-54'}`}
    >
      <Image
        source={source}
        contentFit="cover"
        transition={150}
        className="absolute inset-0 size-full"
        accessibilityIgnoresInvertColors
      />
      {source === null ? <Text className="text-xs text-zinc-400">No image available</Text> : null}
      <View className="absolute bottom-2 left-2 rounded-md bg-zinc-950/85 p-1.5">
        <Text className="text-xs font-bold text-yellow-400">
          {mediaLabel(item.type)} · ★ {item.rating.toFixed(1)}
        </Text>
      </View>
    </View>
  );
}
function mediaLabel(type: MediaCard['type']) {
  return type === 'movie' ? 'Movie' : 'TV show';
}
function releaseYear(date: string) {
  return date.slice(0, 4) || 'Release date TBA';
}
const Poster = memo(function Poster({
  item,
  featured = false,
}: {
  item: MediaCard;
  featured?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`Open ${item.title}, ${mediaLabel(item.type)}`}
      onPress={() => {
        void openTitle(item).catch(() =>
          Alert.alert('Couldn’t open title', 'Check the web app address and try again.'),
        );
      }}
      className={featured ? 'gap-1.5' : 'w-36 gap-1.5'}
    >
      <CardImage item={item} featured={featured} />
      <Text numberOfLines={2} className="text-base font-semibold text-foreground">
        {item.title}
      </Text>
      <Text className="text-sm text-muted">{releaseYear(item.releaseDate)}</Text>
    </Pressable>
  );
});
function renderPoster({ item }: { item: MediaCard }) {
  return <Poster item={item} />;
}
function Separator() {
  return <View className="w-3" />;
}

function RowState({
  pending,
  failed,
  retry,
  empty,
}: {
  pending: boolean;
  failed: boolean;
  retry: () => void;
  empty: boolean;
}) {
  if (pending)
    return (
      <View accessibilityLabel="Loading titles" className="flex-row gap-3 overflow-hidden px-5">
        {[0, 1, 2].map((id) => (
          <View key={id} className="h-54 w-36 rounded-xl bg-default" />
        ))}
      </View>
    );
  if (failed)
    return (
      <View className="items-start gap-2 px-5">
        <Text className="text-sm text-muted">Couldn’t load these titles.</Text>
        <Pressable
          accessibilityRole="button"
          onPress={retry}
          className="rounded-lg bg-yellow-400 px-4 py-2.5"
        >
          <Text className="font-semibold text-zinc-900">Try again</Text>
        </Pressable>
      </View>
    );
  if (empty) return <Text className="px-5 py-6 text-muted">No titles available right now.</Text>;
  return null;
}

export function MediaRow({ section, region }: { section: HomeMediaSection; region: string }) {
  const query = useQuery(
    orpc.home.list.queryOptions({ input: { category: section.category, region } }),
  );
  return (
    <View className="gap-3.5 py-4">
      <View className="gap-1 px-5">
        <Text className="text-foreground text-xl font-semibold">{section.heading}</Text>
        <Text className="text-sm text-muted">{section.caption}</Text>
      </View>
      <RowState
        pending={query.isPending}
        failed={query.isError}
        empty={query.data?.length === 0}
        retry={() => {
          void query.refetch();
        }}
      />
      {query.data && query.data.length > 0 ? (
        <FlatList
          horizontal
          data={query.data}
          renderItem={renderPoster}
          keyExtractor={keyExtractor}
          ItemSeparatorComponent={Separator}
          contentContainerClassName="px-5"
          showsHorizontalScrollIndicator={false}
          initialNumToRender={4}
          maxToRenderPerBatch={4}
        />
      ) : null}
    </View>
  );
}

export function TrendingCard({ type }: { type: 'movie' | 'tv' }) {
  const query = useQuery(orpc.home.trending.queryOptions({ input: { type } }));
  return (
    <View className="mb-4">
      <RowState
        pending={query.isPending}
        failed={query.isError}
        empty={query.data?.length === 0}
        retry={() => {
          void query.refetch();
        }}
      />
      {query.data?.[0] ? <Poster item={query.data[0]} featured /> : null}
    </View>
  );
}
