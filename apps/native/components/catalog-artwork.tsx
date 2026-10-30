import type { CatalogDetail } from '@movies/api/catalog';
import { Image as ExpoImage } from 'expo-image';
import { Text, View } from 'react-native';
import { withUniwind } from 'uniwind';

const Image = withUniwind(ExpoImage);

export function CatalogArtwork({ item }: { item: CatalogDetail }) {
  return (
    <View className="gap-8">
      {item.backdropUrl ? (
        <View className="h-64 overflow-hidden">
          <Image
            source={item.backdropUrl}
            contentFit="cover"
            className="absolute inset-0 size-full"
            accessibilityLabel={`Backdrop of ${item.title}`}
          />
          <View className="absolute inset-0 bg-linear-to-t from-black via-black/60 to-transparent" />
        </View>
      ) : null}
      <View className="px-4">
        <View className="h-96 w-64 items-center justify-center overflow-hidden rounded-lg border border-border bg-zinc-800">
          {item.posterUrl ? (
            <Image
              source={item.posterUrl}
              contentFit="cover"
              className="size-full"
              accessibilityLabel={`Poster of ${item.title}`}
              accessibilityIgnoresInvertColors
            />
          ) : (
            <Text className="text-base text-zinc-400">No Poster</Text>
          )}
        </View>
      </View>
    </View>
  );
}
