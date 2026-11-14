import type { GalleryPoint } from '@native/lib/gallery-gesture';
import { useMemo, type ReactNode } from 'react';
import { PanResponder, View } from 'react-native';

export type GalleryPanProps = {
  children: ReactNode;
  start: (point: GalleryPoint) => void;
  update: (point: GalleryPoint) => void;
  end: () => void;
  cancel: () => void;
};
export function GalleryPanArea({ children, start, update, end, cancel }: GalleryPanProps) {
  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) =>
          start({ x: event.nativeEvent.pageX, y: event.nativeEvent.pageY, touch: true }),
        onPanResponderMove: (event) => {
          if (event.nativeEvent.touches.length !== 1) {
            cancel();
            return;
          }
          update({ x: event.nativeEvent.pageX, y: event.nativeEvent.pageY, touch: true });
        },
        onPanResponderRelease: (event) => {
          update({ x: event.nativeEvent.pageX, y: event.nativeEvent.pageY, touch: true });
          end();
        },
        onPanResponderTerminate: cancel,
      }),
    [start, update, end, cancel],
  );
  return (
    <View className="flex-1 overflow-hidden" testID="gallery-pan-area" {...responder.panHandlers}>
      {children}
    </View>
  );
}
