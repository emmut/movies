import type { PdpExtras } from '@movies/api/pdp';
import { PlayIcon } from '@native/components/icons';
import { MediaViewer } from '@native/components/media-viewer';
import type { GalleryMedia as Media } from '@native/components/media-viewer-types';
import { PdpImage } from '@native/components/pdp-image';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

type MediaKind = 'images' | 'videos';
type Selection = { kind: MediaKind; index: number };

const kindLabels: Record<MediaKind, string> = { images: 'Images', videos: 'Videos' };

export function PdpMedia({ data, title }: { data: PdpExtras; title: string }) {
  const [selected, setSelected] = useState<Selection | null>(null);
  const images: Media[] = data.images.map((item, index) => ({
    id: item.file_path,
    title: 'Image ' + (index + 1),
    image: item.file_path,
  }));
  const videos: Media[] = data.videos.map((item) => ({
    id: item.id,
    title: videoTitle(item),
    video: item.key,
  }));
  const groups = { images, videos };
  return (
    <View className="gap-6">
      <VideoButton count={videos.length} open={() => setSelected({ kind: 'videos', index: 0 })} />
      <ImageThumbnails images={images} open={(index) => setSelected({ kind: 'images', index })} />
      {selected ? (
        <SelectedViewer
          items={groups[selected.kind]}
          selected={selected}
          setIndex={(index) => setSelected({ ...selected, index })}
          close={() => setSelected(null)}
          title={title}
        />
      ) : null}
    </View>
  );
}

function videoTitle(item: PdpExtras['videos'][number]): string {
  return item.name + ' · ' + item.type + (item.official ? ' · Official' : '');
}

function VideoButton({ count, open }: { count: number; open: () => void }) {
  if (count === 0) {
    return null;
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={'Watch Videos (' + count + ')'}
      onPress={open}
      className="bg-default min-h-11 flex-row items-center gap-2 self-start rounded-lg border border-border px-4"
    >
      <PlayIcon className="size-5 text-foreground" />
      <Text className="font-semibold text-foreground">Watch Videos ({count})</Text>
    </Pressable>
  );
}

function ImageThumbnails({ images, open }: { images: Media[]; open: (index: number) => void }) {
  if (images.length === 0) {
    return null;
  }
  return (
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
            onPress={() => open(index)}
            className="aspect-video w-64 overflow-hidden rounded-xl border border-border"
          >
            <PdpImage path={item.image ?? null} title={item.title} />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function SelectedViewer({
  items,
  selected,
  setIndex,
  close,
  title,
}: {
  items: Media[];
  selected: Selection;
  setIndex: (index: number) => void;
  close: () => void;
  title: string;
}) {
  if (items.length === 0) {
    return null;
  }
  return (
    <MediaViewer
      items={items}
      index={Math.min(selected.index, items.length - 1)}
      setIndex={setIndex}
      close={close}
      title={title + ' — ' + kindLabels[selected.kind]}
    />
  );
}
