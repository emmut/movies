import type { HomeMediaSection } from '@movies/api/home';
import { PosterRowSkeleton } from '@native/components/loading-skeletons';
import { MediaPoster, MediaPosterRow } from '@native/components/media-poster';
import { useHomeList, useHomeTrending } from '@native/hooks/use-home-query';
import { Pressable, Text, View } from 'react-native';

function RowState({
  pending,
  failed,
  retry,
  empty,
  featured = false,
}: {
  pending: boolean;
  failed: boolean;
  retry: () => void;
  empty: boolean;
  featured?: boolean;
}) {
  if (pending) {
    return (
      <View className={featured ? undefined : 'px-4'}>
        <PosterRowSkeleton label="Loading titles" featured={featured} />
      </View>
    );
  }
  if (failed) {
    return (
      <View className="items-start gap-2 px-4">
        <Text className="text-sm text-muted">Couldn’t load these titles.</Text>
        <Pressable
          accessibilityRole="button"
          onPress={retry}
          className="rounded-lg bg-yellow-400 px-4 py-2.5"
        >
          <Text className="font-semibold text-zinc-900">Try again</Text>
        </Pressable>
      </View>
    );
  }
  if (empty) {
    return <Text className="px-4 py-6 text-muted">No titles available right now.</Text>;
  }
  return null;
}

export function MediaRow({ section, region }: { section: HomeMediaSection; region: string }) {
  const query = useHomeList({ category: section.category, region });
  return (
    <View className="gap-3 py-4">
      <View className="gap-1 px-4">
        <Text
          accessibilityRole="header"
          className="text-xl font-semibold tracking-tight text-foreground"
        >
          {section.heading}
        </Text>
        <Text className="text-sm text-muted">{section.caption}</Text>
      </View>
      <RowState
        pending={query.isPending}
        failed={query.isError}
        empty={query.data?.length === 0}
        retry={() => {
          void query.refetch();
        }}
      />
      {query.data && query.data.length > 0 ? (
        <View className="px-4">
          <MediaPosterRow items={query.data} />
        </View>
      ) : null}
    </View>
  );
}

export function TrendingCard({ type }: { type: 'movie' | 'tv' }) {
  const query = useHomeTrending({ type });
  return (
    <View>
      <RowState
        featured
        pending={query.isPending}
        failed={query.isError}
        empty={query.data?.length === 0}
        retry={() => {
          void query.refetch();
        }}
      />
      {query.data?.[0] ? <MediaPoster item={query.data[0]} featured /> : null}
    </View>
  );
}
