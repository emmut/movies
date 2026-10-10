import type { HomeMediaSection } from '@movies/api/home';
import { MediaPoster, MediaPosterRow } from '@native/components/media-poster';
import { orpc } from '@native/lib/api';
import { useQuery } from '@tanstack/react-query';
import { Pressable, Text, View } from 'react-native';

function RowState({
  pending,
  failed,
  retry,
  empty,
}: {
  pending: boolean;
  failed: boolean;
  retry: () => void;
  empty: boolean;
}) {
  if (pending)
    return (
      <View accessibilityLabel="Loading titles" className="flex-row gap-3 overflow-hidden px-5">
        {[0, 1, 2].map((id) => (
          <View key={id} className="h-54 w-36 rounded-xl bg-default" />
        ))}
      </View>
    );
  if (failed)
    return (
      <View className="items-start gap-2 px-5">
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
  if (empty) return <Text className="px-5 py-6 text-muted">No titles available right now.</Text>;
  return null;
}

export function MediaRow({ section, region }: { section: HomeMediaSection; region: string }) {
  const query = useQuery(
    orpc.home.list.queryOptions({ input: { category: section.category, region } }),
  );
  return (
    <View className="gap-4 py-4">
      <View className="px-4">
        <Text
          accessibilityRole="header"
          className="text-xl font-semibold tracking-tight text-foreground"
        >
          {section.heading}
        </Text>
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
  const query = useQuery(orpc.home.trending.queryOptions({ input: { type } }));
  return (
    <View>
      <RowState
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
