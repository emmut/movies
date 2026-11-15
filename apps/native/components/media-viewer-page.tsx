import type { GalleryMedia } from '@native/components/media-viewer-types';
import { PdpImage } from '@native/components/pdp-image';
import { TrailerPlayer } from '@native/components/trailer-player';
import { View } from 'react-native';

export function MediaPage({ media, active }: { media: GalleryMedia; active: boolean }) {
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
