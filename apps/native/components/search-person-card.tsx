import type { SearchPersonCard } from '@movies/api/search';
import { MediaBadge } from '@native/components/media-badge';
import { useScrollNavigation } from '@native/components/scroll-navigation';
import { catalogPath } from '@native/lib/catalog-navigation';
import { Image as NativeImage } from 'expo-image';
import { Link, usePathname } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { withUniwind } from 'uniwind';

const Image = withUniwind(NativeImage);
export function SearchPerson({ item }: { item: SearchPersonCard }) {
  const pathname = usePathname();
  const navigationPress = useScrollNavigation();
  return (
    <Link
      href={{ pathname: catalogPath(pathname), params: { type: 'person', id: item.id } }}
      asChild
    >
      <Pressable
        {...navigationPress}
        accessibilityRole="link"
        accessibilityLabel={'Open ' + item.name + ', Person'}
        className="w-36 gap-2"
      >
        <View className="h-54 overflow-hidden rounded-lg border border-border bg-zinc-800">
          {item.profileUrl ? (
            <Image
              source={item.profileUrl}
              contentFit="cover"
              className="size-full"
              accessibilityLabel={'Profile image of ' + item.name}
            />
          ) : (
            <View className="flex-1 items-center justify-center">
              <Text className="text-zinc-400">No Photo</Text>
            </View>
          )}
        </View>
        <Text numberOfLines={2} className="font-semibold text-foreground">
          {item.name}
        </Text>
        {item.department ? <Text className="text-xs text-muted">{item.department}</Text> : null}
        {item.knownFor.length ? (
          <Text numberOfLines={2} className="text-xs text-muted">
            Known for: {item.knownFor.join(', ')}
          </Text>
        ) : null}
        <View className="self-start">
          <MediaBadge type="person" />
        </View>
      </Pressable>
    </Link>
  );
}
