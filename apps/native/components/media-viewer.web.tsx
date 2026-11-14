import { getAdjacentMediaIndex, type MediaDirection } from '@movies/api/media-navigation';
import { GalleryImages, type GalleryMedia as Media } from '@native/components/gallery-images';
import { GalleryKeyboard } from '@native/components/gallery-keyboard';
import { MediaViewerControls } from '@native/components/media-viewer-controls';
import { TrailerPlayer } from '@native/components/trailer-player';
import { useGalleryMotion } from '@native/lib/use-gallery-motion';
import { Animated, Modal, Pressable, Text, View } from 'react-native';
import { SafeAreaView as NativeSafeAreaView } from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';

const SafeAreaView = withUniwind(NativeSafeAreaView);
const AnimatedView = withUniwind(Animated.View);
export function MediaViewer({
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
              <MediaViewerControls
                title={item.title}
                index={index}
                count={items.length}
                move={move}
              />
            </View>
          </SafeAreaView>
        </GalleryKeyboard>
      </AnimatedView>
    </Modal>
  );
}
