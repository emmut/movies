import type { MediaCard, HomeMediaSection } from '@movies/api/home';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { memo } from 'react';
import {
  Alert,
  FlatList,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';

import { orpc } from '../lib/api';
import { webUrl } from '../lib/connections';

function keyExtractor(item: MediaCard) {
  return `${item.type}-${item.id}`;
}
async function openTitle(item: MediaCard) {
  await Linking.openURL(`${webUrl}/${item.type}/${item.id}`);
}
function CardImage({ item, featured }: { item: MediaCard; featured: boolean }) {
  const source = featured ? item.backdropUrl : item.posterUrl;
  return (
    <View style={[styles.image, featured ? styles.backdrop : styles.cover]}>
      <Image
        source={source}
        contentFit="cover"
        transition={150}
        style={StyleSheet.absoluteFill}
        accessibilityIgnoresInvertColors
      />
      {source === null ? <Text style={styles.noImage}>No image available</Text> : null}
      <View style={styles.badge}>
        <Text style={styles.badgeText}>
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
  const dark = useColorScheme() === 'dark';
  const color = dark ? '#fafafa' : '#18181b';
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`Open ${item.title}, ${mediaLabel(item.type)}`}
      onPress={() => {
        void openTitle(item).catch(() =>
          Alert.alert('Couldn’t open title', 'Check the web app address and try again.'),
        );
      }}
      style={featured ? styles.featured : styles.poster}
    >
      <CardImage item={item} featured={featured} />
      <Text numberOfLines={2} style={[styles.title, { color }]}>
        {item.title}
      </Text>
      <Text style={styles.caption}>{releaseYear(item.releaseDate)}</Text>
    </Pressable>
  );
});
function renderPoster({ item }: { item: MediaCard }) {
  return <Poster item={item} />;
}
function Separator() {
  return <View style={styles.separator} />;
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
      <View accessibilityLabel="Loading titles" style={styles.skeletonRow}>
        {[0, 1, 2].map((id) => (
          <View key={id} style={styles.skeleton} />
        ))}
      </View>
    );
  if (failed)
    return (
      <View style={styles.state}>
        <Text style={styles.caption}>Couldn’t load these titles.</Text>
        <Pressable accessibilityRole="button" onPress={retry} style={styles.retry}>
          <Text style={styles.retryText}>Try again</Text>
        </Pressable>
      </View>
    );
  if (empty) return <Text style={styles.empty}>No titles available right now.</Text>;
  return null;
}

export function MediaRow({ section, region }: { section: HomeMediaSection; region: string }) {
  const query = useQuery(
    orpc.home.list.queryOptions({ input: { category: section.category, region } }),
  );
  return (
    <View style={styles.section}>
      <View style={styles.heading}>
        <Text className="text-foreground text-xl font-semibold">{section.heading}</Text>
        <Text style={styles.caption}>{section.caption}</Text>
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
          contentContainerStyle={styles.row}
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
    <View style={styles.trending}>
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
const styles = StyleSheet.create({
  section: { gap: 14, paddingVertical: 16 },
  heading: { paddingHorizontal: 20, gap: 4 },
  row: { paddingHorizontal: 20 },
  separator: { width: 12 },
  poster: { width: 142, gap: 5 },
  featured: { gap: 6 },
  image: {
    backgroundColor: '#27272a',
    borderRadius: 12,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cover: { height: 213 },
  backdrop: { height: 200, width: '100%' },
  title: { fontSize: 16, fontWeight: '600' },
  caption: { fontSize: 13, color: '#88888f' },
  badge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: '#09090bdd',
    padding: 6,
    borderRadius: 6,
  },
  badgeText: { color: '#facc15', fontSize: 11, fontWeight: '700' },
  noImage: { color: '#a1a1aa', fontSize: 12 },
  skeletonRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, overflow: 'hidden' },
  skeleton: { width: 142, height: 213, borderRadius: 12, backgroundColor: '#88888825' },
  state: { paddingHorizontal: 20, gap: 8, alignItems: 'flex-start' },
  retry: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#facc15',
    borderRadius: 8,
  },
  retryText: { color: '#18181b', fontWeight: '600' },
  empty: { color: '#88888f', paddingHorizontal: 20, paddingVertical: 24 },
  trending: { marginBottom: 16 },
});
