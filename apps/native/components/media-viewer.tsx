import { getAdjacentMediaIndex, type MediaDirection } from '@movies/api/media-navigation';
import type { GalleryMedia } from '@native/components/gallery-images';
import { MediaViewerControls } from '@native/components/media-viewer-controls';
import { PdpImage } from '@native/components/pdp-image';
import { TrailerPlayer } from '@native/components/trailer-player';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import { FlatList, Modal, Pressable, Text, View } from 'react-native';
import {
  SafeAreaProvider,
  SafeAreaView as NativeSafeAreaView,
} from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';

const SafeAreaView = withUniwind(NativeSafeAreaView);

/** The OS owns paging momentum; only the settled page changes the active media. */
export function MediaViewer({
  items,
  index,
  setIndex,
  close,
  title,
}: {
  items: GalleryMedia[];
  index: number;
  setIndex: (value: number) => void;
  close: () => void;
  title: string;
}) {
  const pager = useRef<FlatList<GalleryMedia>>(null);
  const [width, setWidth] = useState(0);
  const item = items[index];

  function move(direction: MediaDirection) {
    const next = getAdjacentMediaIndex(index, items.length, direction);
    // Avoid queuing animated scroll commands when the user taps repeatedly.
    pager.current?.scrollToIndex({ index: next, animated: false });
    setIndex(next);
  }

  return (
    <Modal
      visible
      animationType="fade"
      presentationStyle="fullScreen"
      supportedOrientations={['portrait', 'landscape']}
      onRequestClose={close}
    >
      <SafeAreaProvider>
        <SafeAreaView className="flex-1 bg-black">
          <StatusBar style="light" />
          <View className="flex-row items-center gap-3 px-4 py-2">
            <Text
              accessibilityRole="header"
              numberOfLines={2}
              className="flex-1 text-lg font-semibold text-white"
            >
              {title}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close media viewer"
              onPress={close}
              className="min-h-12 justify-center rounded-xl bg-white/10 px-4"
            >
              <Text className="font-semibold text-white">Done</Text>
            </Pressable>
          </View>
          <View
            className="min-h-0 flex-1 overflow-hidden"
            onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
          >
            {width > 0 ? (
              <FlatList
                key={width}
                ref={pager}
                data={items}
                horizontal
                pagingEnabled
                bounces={false}
                showsHorizontalScrollIndicator={false}
                initialScrollIndex={index}
                initialNumToRender={1}
                windowSize={3}
                keyExtractor={(media) => media.id}
                getItemLayout={(_, page) => ({ length: width, offset: width * page, index: page })}
                onMomentumScrollEnd={(event) => {
                  const page = Math.round(event.nativeEvent.contentOffset.x / width);
                  setIndex(Math.max(0, Math.min(items.length - 1, page)));
                }}
                extraData={index}
                renderItem={({ item: media, index: page }) => (
                  // Measured page width is required by the native pager's layout contract.
                  <View
                    style={{ width }}
                    className="h-full items-center justify-center overflow-hidden"
                    accessibilityElementsHidden={page !== index}
                    importantForAccessibility={page === index ? 'auto' : 'no-hide-descendants'}
                  >
                    <MediaPage media={media} active={page === index} />
                  </View>
                )}
              />
            ) : null}
          </View>
          <MediaViewerControls title={item.title} index={index} count={items.length} move={move} />
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

function MediaPage({ media, active }: { media: GalleryMedia; active: boolean }) {
  if (!media.video) {
    return <PdpImage key={media.id} path={media.image ?? null} title={media.title} full />;
  }
  if (!active) {
    return null;
  }
  return (
    <View className="aspect-video max-h-full w-full">
      <TrailerPlayer key={media.id} videoKey={media.video} title={media.title} />
    </View>
  );
}
