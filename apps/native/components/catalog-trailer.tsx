import type { CatalogTitleInput } from '@movies/api/catalog-support';
import { CatalogSectionState } from '@native/components/catalog-section-state';
import { TrailerPlayer } from '@native/components/trailer-player';
import { orpc } from '@native/lib/api';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { SafeAreaView as NativeSafeAreaView } from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';

const SafeAreaView = withUniwind(NativeSafeAreaView);
function TrailerSheet({
  videoKey,
  title,
  onClose,
}: {
  videoKey: string;
  title: string;
  onClose: () => void;
}) {
  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 gap-4 bg-background p-4">
        <View className="flex-row items-center justify-between gap-3">
          <Text accessibilityRole="header" className="flex-1 text-xl font-semibold text-foreground">
            {title} - Trailer
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close trailer"
            onPress={onClose}
            className="min-h-11 justify-center rounded-lg bg-default px-4 py-2"
          >
            <Text className="text-foreground">Done</Text>
          </Pressable>
        </View>
        <View className="aspect-video min-h-52 w-full bg-black">
          <TrailerPlayer videoKey={videoKey} title={title} />
        </View>
      </SafeAreaView>
    </Modal>
  );
}
function TrailerAction({
  videoKey,
  title,
  type,
}: {
  videoKey: string;
  title: string;
  type: CatalogTitleInput['type'];
}) {
  const [open, setOpen] = useState(false);
  const buttonColor = type === 'movie' ? 'bg-yellow-600' : 'bg-red-600';
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Play Trailer for ${title}`}
        onPress={() => setOpen(true)}
        className={`min-h-11 self-start justify-center rounded-lg px-4 py-2 ${buttonColor}`}
      >
        <Text className="font-semibold text-white">▷ Play Trailer</Text>
      </Pressable>
      {open ? (
        <TrailerSheet videoKey={videoKey} title={title} onClose={() => setOpen(false)} />
      ) : null}
    </>
  );
}
export function CatalogTrailer({ input, title }: { input: CatalogTitleInput; title: string }) {
  const query = useQuery(orpc.catalog.trailer.queryOptions({ input, retry: false }));
  if (query.data === null) return null;
  return (
    <View className="gap-3">
      <CatalogSectionState
        label="trailer"
        pending={query.isPending}
        failed={query.isError}
        retry={() => {
          void query.refetch();
        }}
      />
      {query.data ? (
        <TrailerAction videoKey={query.data.key} type={input.type} title={title} />
      ) : null}
    </View>
  );
}
