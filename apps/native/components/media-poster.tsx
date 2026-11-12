import { displayRating, type MediaCard } from '@movies/api/home';
import { ArrowUpRightIcon, StarIcon } from '@native/components/icons';
import { MediaBadge } from '@native/components/media-badge';
import { useScrollNavigation } from '@native/components/scroll-navigation';
import { SystemQuickAdd } from '@native/components/system-quick-add';
import { catalogPath } from '@native/lib/catalog-navigation';
import { Image as ExpoImage } from 'expo-image';
import { Link, usePathname } from 'expo-router';
import { memo, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { withUniwind } from 'uniwind';

const Image = withUniwind(ExpoImage);

function keyExtractor(item: MediaCard) {
  return `${item.type}-${item.id}`;
}

function CardMetadata({ item, featured }: { item: MediaCard; featured: boolean }) {
  return (
    <View className={`absolute right-0 bottom-0 left-0 ${featured ? 'gap-2 p-5' : 'gap-1 p-3'}`}>
      <Text
        numberOfLines={2}
        className={`font-semibold text-white ${featured ? 'text-2xl leading-tight tracking-tight' : 'text-sm'}`}
      >
        {item.title}
      </Text>
      <View className="flex-row items-center justify-between">
        <Text className="text-xs text-zinc-300">{releaseYear(item.releaseDate)}</Text>
        {featured ? null : (
          <View className="flex-row items-center gap-1">
            <StarIcon
              className="size-3 text-yellow-500"
              fillClassName="text-yellow-500"
              accessible={false}
            />
            <Text
              accessibilityLabel={`Rating ${displayRating(item.rating).toFixed(1)} out of 10`}
              className="text-xs text-yellow-500"
            >
              {displayRating(item.rating).toFixed(1)}
            </Text>
          </View>
        )}
      </View>
      {featured ? (
        <View className="mt-2 flex-row items-center gap-2">
          <Text className="text-sm font-semibold text-white">Explore title</Text>
          <ArrowUpRightIcon className="size-4 text-white" accessible={false} />
        </View>
      ) : null}
    </View>
  );
}

function posterDimensions(featured: boolean, fluid: boolean) {
  if (featured) {
    return 'h-64 w-full rounded-2xl';
  }
  if (fluid) {
    return 'aspect-2/3 w-full rounded-xl';
  }
  return 'h-54 rounded-xl';
}

function CardImage({
  item,
  featured,
  fluid,
}: {
  item: MediaCard;
  featured: boolean;
  fluid: boolean;
}) {
  const source = featured ? item.backdropUrl : item.posterUrl;
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const reducedMotion = useReducedMotion();
  const hasImage = source !== null && source !== failedSource;
  return (
    <View
      className={`items-center justify-center overflow-hidden border border-border bg-zinc-800 ${posterDimensions(featured, fluid)}`}
    >
      {hasImage ? (
        <Image
          source={source}
          contentFit="cover"
          transition={reducedMotion ? 0 : 150}
          onError={() => setFailedSource(source)}
          className="absolute inset-0 size-full"
          accessibilityIgnoresInvertColors
          accessible={false}
        />
      ) : null}
      <View className="absolute inset-0 bg-linear-to-t from-black via-black/60 to-transparent" />
      {!hasImage ? (
        <Text className="absolute inset-x-3 top-20 text-center text-xs text-zinc-400">
          No image available
        </Text>
      ) : null}
      <View className="absolute top-2 left-2">
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
  fluid = false,
  region,
}: {
  item: MediaCard;
  featured?: boolean;
  fluid?: boolean;
  region?: string;
}) {
  const pathname = usePathname();
  const navigationPress = useScrollNavigation();
  return (
    <View className={featured || fluid ? 'w-full' : 'w-36'}>
      <Link
        href={{
          pathname: catalogPath(pathname),
          params: { type: item.type, id: item.id, ...(region ? { region } : {}) },
        }}
        asChild
      >
        <Pressable
          {...navigationPress}
          accessibilityRole="link"
          accessibilityLabel={`Open ${item.title}, ${mediaLabel(item.type)}`}
          className="w-full rounded-xl active:opacity-80"
        >
          <CardImage item={item} featured={featured} fluid={fluid} />
        </Pressable>
      </Link>
      <View className="absolute top-2 right-2">
        <SystemQuickAdd item={item} />
      </View>
    </View>
  );
});
function Separator() {
  return <View className="w-3" />;
}

export function MediaPosterRow({ items, region }: { items: MediaCard[]; region?: string }) {
  return (
    <FlatList
      horizontal
      data={items}
      renderItem={({ item }) => <MediaPoster item={item} region={region} />}
      keyExtractor={keyExtractor}
      ItemSeparatorComponent={Separator}
      showsHorizontalScrollIndicator={false}
      initialNumToRender={4}
      maxToRenderPerBatch={4}
    />
  );
}
