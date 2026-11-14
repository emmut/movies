import type { PdpExtras } from '@movies/api/pdp';
import type { GalleryMedia as Media } from '@native/components/gallery-images';
import { PlayIcon } from '@native/components/icons';
import { MediaViewer } from '@native/components/media-viewer';
import { PdpImage } from '@native/components/pdp-image';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

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
        <MediaViewer
          items={items}
          index={Math.min(selected.index, items.length - 1)}
          setIndex={(index) => setSelected({ ...selected, index })}
          close={() => setSelected(null)}
          title={title + (selected.kind === 'images' ? ' — Images' : ' — Videos')}
        />
      ) : null}
    </View>
  );
}
