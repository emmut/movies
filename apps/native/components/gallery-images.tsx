import { getAdjacentMediaIndex } from '@movies/api/media-navigation';
import { GalleryPanArea } from '@native/components/gallery-pan-area';
import { PdpImage } from '@native/components/pdp-image';
import type { useGalleryMotion } from '@native/lib/use-gallery-motion';
import { Animated, View } from 'react-native';
import { withUniwind } from 'uniwind';

const AnimatedView = withUniwind(Animated.View);
export type GalleryMedia = { id: string; title: string; image?: string; video?: string };

/** Mount only the active image and immediate neighbors, retaining their decoded image views. */
export function GalleryImages({
  items,
  index,
  motion,
}: {
  items: GalleryMedia[];
  index: number;
  motion: ReturnType<typeof useGalleryMotion>;
}) {
  let neighbors = [index];
  if (items.length > 1) {
    neighbors = [
      getAdjacentMediaIndex(index, items.length, 'previous'),
      index,
      getAdjacentMediaIndex(index, items.length, 'next'),
    ];
  }
  const origin = items.length > 1 ? motion.width : 0;
  return (
    <GalleryPanArea
      start={motion.start}
      update={motion.update}
      end={motion.end}
      cancel={motion.cancel}
    >
      <View
        className="flex-1"
        onLayout={(event) => motion.setWidth(event.nativeEvent.layout.width)}
      >
        {/* Animated transforms require style objects; Tailwind owns all static layout. */}
        <AnimatedView
          testID="gallery-image-track"
          className="h-full w-full flex-row"
          style={{ transform: [{ translateX: Animated.subtract(motion.x, origin) }] }}
        >
          {neighbors.map((itemIndex, slot) => {
            const active = itemIndex === index && (neighbors.length === 1 || slot === 1);
            const item = items[itemIndex];
            let key = item.id;
            if (items.length === 2 && slot === 0) {
              key += '-previous';
            }
            return (
              <View
                key={key}
                className="h-full w-full shrink-0"
                aria-hidden={!active}
                accessibilityElementsHidden={!active}
                importantForAccessibility={active ? 'auto' : 'no-hide-descendants'}
              >
                <PdpImage path={item.image ?? null} title={item.title} full />
              </View>
            );
          })}
        </AnimatedView>
      </View>
    </GalleryPanArea>
  );
}
