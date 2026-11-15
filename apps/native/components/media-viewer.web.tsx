import { getAdjacentMediaIndex, type MediaDirection } from '@movies/api/media-navigation';
import { MediaViewerFrame } from '@native/components/media-viewer-frame';
import { MediaPage } from '@native/components/media-viewer-page';
import type { MediaViewerProps } from '@native/components/media-viewer-types';
import { View } from 'react-native';

/** A simple browser preview; the native app owns gesture and momentum paging. */
export function MediaViewer({ items, index, setIndex, close, title }: MediaViewerProps) {
  const item = items[index];
  function move(direction: MediaDirection) {
    setIndex(getAdjacentMediaIndex(index, items.length, direction));
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
      <View className="min-h-0 flex-1 items-center justify-center overflow-hidden">
        <MediaPage key={item.id} media={item} active />
      </View>
    </MediaViewerFrame>
  );
}
