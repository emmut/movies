import { getAdjacentMediaIndex, type MediaDirection } from '@movies/api/media-navigation';
import type { PdpExtras } from '@movies/api/pdp';
import { GalleryImages, type GalleryMedia as Media } from '@native/components/gallery-images';
import { GalleryKeyboard } from '@native/components/gallery-keyboard';
import { ChevronRightIcon, ChevronLeftIcon, PlayIcon } from '@native/components/icons';
import { PdpImage } from '@native/components/pdp-image';
import { TrailerPlayer } from '@native/components/trailer-player';
import { useGalleryMotion } from '@native/lib/use-gallery-motion';
import { useState } from 'react';
import { Animated, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView as NativeSafeAreaView } from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';

const SafeAreaView = withUniwind(NativeSafeAreaView);
const AnimatedView = withUniwind(Animated.View);
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
  const item = items[index];
  const motion = useGalleryMotion(index, items.length, setIndex, close);
  function move(direction: MediaDirection) {
    if (item.video) {
      motion.jump(getAdjacentMediaIndex(index, items.length, direction));
    } else {
      motion.move(direction);
    }
  }
  return (
    <Modal
      visible
      transparent
      animationType="none"
      presentationStyle="overFullScreen"
      onRequestClose={close}
    >
      {/* Continuous gesture transforms/opacity require Animated's style API. */}
      <AnimatedView
        testID="gallery-backdrop"
        className="absolute inset-0 bg-black"
        style={{ opacity: motion.opacity }}
      />
      <AnimatedView
        testID="gallery-surface"
        className="flex-1"
        style={{ transform: [{ translateY: motion.y }] }}
      >
        <GalleryKeyboard move={move} jump={motion.jump} count={items.length} close={close}>
          <SafeAreaView className="flex-1 bg-black">
            <View className="flex-1 gap-4 p-4">
              <View className="flex-row items-center justify-between gap-3">
                <Text
                  accessibilityRole="header"
                  className="flex-1 text-xl font-semibold text-white"
                >
                  {title}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Close media viewer"
                  onPress={close}
                  className="min-h-11 justify-center rounded-lg bg-white/10 px-4"
                >
                  <Text className="text-white">Done</Text>
                </Pressable>
              </View>
              {item.video ? (
                <View className="flex-1 items-center justify-center overflow-hidden bg-black">
                  <View className="aspect-video w-full">
                    <TrailerPlayer key={item.id} videoKey={item.video} title={item.title} />
                  </View>
                </View>
              ) : (
                <GalleryImages items={items} index={index} motion={motion} />
              )}
              <Text className="text-center font-medium text-white">{item.title}</Text>
              <View className="flex-row items-center justify-center gap-5">
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Previous media"
                  disabled={items.length < 2}
                  accessibilityState={{ disabled: items.length < 2 }}
                  onPress={() => move('previous')}
                  className="min-h-11 justify-center rounded-lg bg-white/10 px-4"
                >
                  <ChevronLeftIcon className="size-5 text-white" />
                  <Text className="text-white">Previous</Text>
                </Pressable>
                <Text accessibilityLiveRegion="polite" className="text-white/70">
                  {index + 1} / {items.length}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Next media"
                  disabled={items.length < 2}
                  accessibilityState={{ disabled: items.length < 2 }}
                  onPress={() => move('next')}
                  className="min-h-11 justify-center rounded-lg bg-white/10 px-4"
                >
                  <ChevronRightIcon className="size-5 text-white" />
                  <Text className="text-white">Next</Text>
                </Pressable>
              </View>
            </View>
          </SafeAreaView>
        </GalleryKeyboard>
      </AnimatedView>
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
