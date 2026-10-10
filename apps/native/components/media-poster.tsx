import { displayRating, type MediaCard } from '@movies/api/home';
import { MediaBadge } from '@native/components/media-badge';
import { Image as ExpoImage } from 'expo-image';
import { Link } from 'expo-router';
import { memo } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { withUniwind } from 'uniwind';

const Image = withUniwind(ExpoImage);

function keyExtractor(item: MediaCard) {
  return `${item.type}-${item.id}`;
}

function CardMetadata({ item, featured }: { item: MediaCard; featured: boolean }) {
  return (
    <View className="absolute bottom-0 left-0 right-0 gap-1 p-3">
      <Text numberOfLines={2} className="text-sm font-semibold text-white">
        {item.title}
      </Text>
      <View className="flex-row items-center justify-between">
        <Text className="text-xs text-zinc-300">{releaseYear(item.releaseDate)}</Text>
        {featured ? null : (
          <Text
            accessibilityLabel={`Rating ${displayRating(item.rating).toFixed(1)} out of 10`}
            className="text-xs text-yellow-500"
          >
            ★ {displayRating(item.rating).toFixed(1)}
          </Text>
        )}
      </View>
    </View>
  );
}

function CardImage({ item, featured }: { item: MediaCard; featured: boolean }) {
  const source = featured ? item.backdropUrl : item.posterUrl;
  return (
    <View
      className={`items-center justify-center overflow-hidden border border-border bg-zinc-800 ${featured ? 'h-52 w-full rounded-xl' : 'h-54 rounded-lg'}`}
    >
      <Image
        source={source}
        contentFit="cover"
        transition={150}
        className="absolute inset-0 size-full"
        accessibilityIgnoresInvertColors
      />
      <View className="absolute inset-0 bg-linear-to-t from-black via-black/60 to-transparent" />
      {source === null ? <Text className="text-xs text-zinc-400">No image available</Text> : null}
      <View className="absolute left-2 top-2">
        <MediaBadge type={item.type} />
      </View>
      <CardMetadata item={item} featured={featured} />
    </View>
  );
}
function mediaLabel(type: MediaCard['type']) {
  return type === 'movie' ? 'Movie' : 'TV Show';
}
function releaseYear(date: string) {
  return date.slice(0, 4) || 'Release date TBA';
}
export const MediaPoster = memo(function Poster({
  item,
  featured = false,
}: {
  item: MediaCard;
  featured?: boolean;
}) {
  return (
    <Link href={{ pathname: '/[type]/[id]', params: { type: item.type, id: item.id } }} asChild>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`Open ${item.title}, ${mediaLabel(item.type)}`}
        className={featured ? 'w-full' : 'w-36'}
      >
        <CardImage item={item} featured={featured} />
      </Pressable>
    </Link>
  );
});
function renderPoster({ item }: { item: MediaCard }) {
  return <MediaPoster item={item} />;
}
function Separator() {
  return <View className="w-3" />;
}

export function MediaPosterRow({ items }: { items: MediaCard[] }) {
  return (
    <FlatList
      horizontal
      data={items}
      renderItem={renderPoster}
      keyExtractor={keyExtractor}
      ItemSeparatorComponent={Separator}
      showsHorizontalScrollIndicator={false}
      initialNumToRender={4}
      maxToRenderPerBatch={4}
    />
  );
}
