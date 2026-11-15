import { Image as NativeImage } from 'expo-image';
import { useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { withUniwind } from 'uniwind';

const Image = withUniwind(NativeImage);

const presentations = {
  full: { size: 'original', fit: 'contain' },
  card: { size: 'w500', fit: 'cover' },
} as const;

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
  if (!path || failed) {
    return <ImageFallback full={full} />;
  }
  return (
    <LoadedImage key={path} path={path} title={title} full={full} failed={() => setFailed(true)} />
  );
}

function ImageFallback({ full }: { full: boolean }) {
  return (
    <View className={`flex-1 items-center justify-center p-4 ${full ? 'bg-black' : 'bg-default'}`}>
      <Text className={`text-center ${full ? 'text-zinc-400' : 'text-muted'}`}>
        No image available
      </Text>
    </View>
  );
}

function LoadedImage({
  path,
  title,
  full,
  failed,
}: {
  path: string;
  title: string;
  full: boolean;
  failed: () => void;
}) {
  const [loaded, setLoaded] = useState(false);
  const reduced = useReducedMotion();
  const presentation = full ? presentations.full : presentations.card;
  return (
    <View className="relative size-full">
      <ImageLoading full={full} loaded={loaded} title={title} />
      <Image
        source={'https://image.tmdb.org/t/p/' + presentation.size + path}
        accessibilityLabel={title}
        contentFit={presentation.fit}
        className="size-full"
        transition={reduced ? 0 : 150}
        onLoad={() => setLoaded(true)}
        onError={failed}
      />
    </View>
  );
}

function ImageLoading({ full, loaded, title }: { full: boolean; loaded: boolean; title: string }) {
  if (!full || loaded) {
    return null;
  }
  return (
    <View className="absolute inset-0 items-center justify-center">
      <ActivityIndicator accessibilityLabel={'Loading ' + title} />
    </View>
  );
}
