import { getAdjacentMediaIndex, type MediaDirection } from '@movies/api/media-navigation';
import { MediaViewerFrame } from '@native/components/media-viewer-frame';
import { MediaPage } from '@native/components/media-viewer-page';
import type { GalleryMedia, MediaViewerProps } from '@native/components/media-viewer-types';
import { useRef, useState } from 'react';
import { FlatList, View } from 'react-native';

function clampPage(page: number, count: number) {
  return Math.max(0, Math.min(count - 1, page));
}

/** The OS owns paging momentum; only the settled page changes the active media. */
export function MediaViewer({ items, index, setIndex, close, title }: MediaViewerProps) {
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
    <MediaViewerFrame
      title={title}
      caption={item.title}
      index={index}
      count={items.length}
      move={move}
      close={close}
    >
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
              setIndex(clampPage(page, items.length));
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
    </MediaViewerFrame>
  );
}
