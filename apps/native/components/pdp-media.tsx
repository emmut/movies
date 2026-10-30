import { getAdjacentMediaIndex, getSwipeMediaDirection } from '@movies/api/media-navigation';
import type { PdpExtras } from '@movies/api/pdp';
import { ChevronRightIcon, ChevronLeftIcon, PlayIcon } from '@native/components/icons';
import { TrailerPlayer } from '@native/components/trailer-player';
import { Image as NativeImage } from 'expo-image';
import { useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView as NativeSafeAreaView } from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';

const SafeAreaView = withUniwind(NativeSafeAreaView);
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
  if (!path || failed) {
    return (
      <View className="flex-1 items-center justify-center bg-zinc-900 p-4">
        <Text className="text-center text-zinc-300">No image available</Text>
      </View>
    );
  }
  return (
    <Image
      source={'https://image.tmdb.org/t/p/' + (full ? 'original' : 'w500') + path}
      accessibilityLabel={title}
      contentFit={full ? 'contain' : 'cover'}
      className="size-full"
      onError={() => setFailed(true)}
    />
  );
}
type Media = { id: string; title: string; image?: string; video?: string };
function Viewer({
  items,
  index,
  setIndex,
  close,
  title,
}: {
  items: Media[];
  index: number;
  setIndex: (value: number) => void;
  close: () => void;
  title: string;
}) {
  const touch = useRef<number | null>(null);
  const item = items[index];
  function move(direction: 'previous' | 'next') {
    setIndex(getAdjacentMediaIndex(index, items.length, direction));
  }
  return (
    <Modal visible animationType="slide" presentationStyle="fullScreen" onRequestClose={close}>
      <SafeAreaView className="flex-1 gap-4 bg-background p-4">
        <View className="flex-row items-center justify-between gap-3">
          <Text accessibilityRole="header" className="flex-1 text-xl font-semibold text-foreground">
            {title}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close media viewer"
            onPress={close}
            className="bg-default min-h-11 justify-center rounded-lg px-4"
          >
            <Text className="text-foreground">Done</Text>
          </Pressable>
        </View>
        <View
          className="flex-1 items-center justify-center overflow-hidden bg-black"
          onTouchStart={(event) => {
            touch.current = event.nativeEvent.pageX;
          }}
          onTouchEnd={(event) => {
            const start = touch.current;
            touch.current = null;
            if (start !== null) {
              const direction = getSwipeMediaDirection(start, event.nativeEvent.pageX);
              if (direction) {
                move(direction);
              }
            }
          }}
          onTouchCancel={() => {
            touch.current = null;
          }}
        >
          {item.video ? (
            <View className="aspect-video w-full">
              <TrailerPlayer key={item.id} videoKey={item.video} title={item.title} />
            </View>
          ) : (
            <PdpImage key={item.id} path={item.image ?? null} title={item.title} full />
          )}
        </View>
        <Text className="text-center font-medium text-foreground">{item.title}</Text>
        <View className="flex-row items-center justify-center gap-5">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Previous media"
            onPress={() => move('previous')}
            className="bg-default min-h-11 justify-center rounded-lg px-4"
          >
            <ChevronLeftIcon className="size-5 text-foreground" />
            <Text className="text-foreground">Previous</Text>
          </Pressable>
          <Text accessibilityLiveRegion="polite" className="text-muted">
            {index + 1} / {items.length}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Next media"
            onPress={() => move('next')}
            className="bg-default min-h-11 justify-center rounded-lg px-4"
          >
            <ChevronRightIcon className="size-5 text-foreground" />
            <Text className="text-foreground">Next</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
export function PdpMedia({ data, title }: { data: PdpExtras; title: string }) {
  const [selected, setSelected] = useState<{ kind: 'images' | 'videos'; index: number } | null>(
    null,
  );
  const images: Media[] = data.images.map((item, index) => ({
    id: item.file_path,
    title: 'Image ' + (index + 1),
    image: item.file_path,
  }));
  const videos: Media[] = data.videos.map((item) => ({
    id: item.id,
    title: item.name + ' · ' + item.type + (item.official ? ' · Official' : ''),
    video: item.key,
  }));
  const items = selected?.kind === 'videos' ? videos : images;
  return (
    <View className="gap-6">
      {videos.length ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={'Watch Videos (' + videos.length + ')'}
          onPress={() => setSelected({ kind: 'videos', index: 0 })}
          className="bg-default min-h-11 flex-row items-center gap-2 self-start rounded-lg border border-border px-4"
        >
          <PlayIcon className="size-5 text-foreground" />
          <Text className="font-semibold text-foreground">Watch Videos ({videos.length})</Text>
        </Pressable>
      ) : null}
      {images.length ? (
        <View className="gap-3">
          <Text accessibilityRole="header" className="text-xl font-semibold text-foreground">
            Images ({images.length})
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-3"
          >
            {images.map((item, index) => (
              <Pressable
                key={item.id + index}
                accessibilityRole="button"
                accessibilityLabel={'Open image ' + (index + 1) + ' of ' + images.length}
                onPress={() => setSelected({ kind: 'images', index })}
                className="aspect-video w-64 overflow-hidden rounded-xl border border-border"
              >
                <PdpImage path={item.image ?? null} title={item.title} />
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}
      {selected && items.length ? (
        <Viewer
          items={items}
          index={selected.index}
          setIndex={(index) => setSelected({ ...selected, index })}
          close={() => setSelected(null)}
          title={title + (selected.kind === 'images' ? ' — Images' : ' — Videos')}
        />
      ) : null}
    </View>
  );
}
