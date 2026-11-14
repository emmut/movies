import { Image as NativeImage } from 'expo-image';
import { useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { withUniwind } from 'uniwind';

const Image = withUniwind(NativeImage);
export function PdpImage({
  path,
  title,
  full = false,
}: {
  path: string | null;
  title: string;
  full?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const reduced = useReducedMotion();
  if (!path || failed) {
    return (
      <View
        className={`flex-1 items-center justify-center p-4 ${full ? 'bg-black' : 'bg-default'}`}
      >
        <Text className={`text-center ${full ? 'text-zinc-400' : 'text-muted'}`}>
          No image available
        </Text>
      </View>
    );
  }
  return (
    <View className="relative size-full">
      {full && !loaded ? (
        <View className="absolute inset-0 items-center justify-center">
          <ActivityIndicator accessibilityLabel={'Loading ' + title} />
        </View>
      ) : null}
      <Image
        source={'https://image.tmdb.org/t/p/' + (full ? 'original' : 'w500') + path}
        accessibilityLabel={title}
        contentFit={full ? 'contain' : 'cover'}
        className="size-full"
        transition={reduced ? 0 : 150}
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
      />
    </View>
  );
}
