import { catalogDetailInput, parseCatalogId, type CatalogDetailInput } from '@movies/api/catalog';
import { useQuery } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { SafeAreaView as NativeSafeAreaView } from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';

import { orpc } from '../lib/api';
import { useRegion } from '../lib/preferences';
import { BottomNavigation } from './bottom-navigation';
import { CatalogContent } from './catalog-content';

const SafeAreaView = withUniwind(NativeSafeAreaView);

function TitleNotFound() {
  const router = useRouter();
  return (
    <View className="flex-1 items-start justify-center gap-4 px-5">
      <Text accessibilityRole="header" className="text-2xl font-bold text-foreground">
        Title not found
      </Text>
      <Text className="text-base text-muted">This movie or TV show is no longer available.</Text>
      <Pressable
        accessibilityRole="button"
        className="rounded-lg bg-default px-4 py-3"
        onPress={() => router.replace('/')}
      >
        <Text className="font-semibold text-foreground">Go to Home</Text>
      </Pressable>
    </View>
  );
}
function TitleLoadError({ error, retry }: { error: Error; retry: () => void }) {
  if ('code' in error && error.code === 'NOT_FOUND') return <TitleNotFound />;
  return (
    <View className="flex-1 items-start justify-center gap-4 px-5">
      <Text className="text-xl font-semibold text-foreground">Couldn’t load this title.</Text>
      <Text className="text-base text-muted">Check your connection and try again.</Text>
      <Pressable
        accessibilityRole="button"
        className="rounded-lg bg-default px-4 py-3"
        onPress={() => {
          void retry();
        }}
      >
        <Text className="font-semibold text-foreground">Try again</Text>
      </Pressable>
    </View>
  );
}
function CatalogQuery({ input }: { input: CatalogDetailInput }) {
  const query = useQuery(orpc.catalog.details.queryOptions({ input, retry: false }));
  if (query.isPending) {
    return (
      <View className="flex-1 items-center justify-center gap-3">
        <ActivityIndicator accessibilityLabel="Loading title" />
        <Text className="text-muted">Loading title…</Text>
      </View>
    );
  }
  if (query.isError)
    return (
      <TitleLoadError
        error={query.error}
        retry={() => {
          void query.refetch();
        }}
      />
    );
  return (
    <>
      <Stack.Screen options={{ title: query.data.title }} />
      <CatalogContent item={query.data} region={input.region} />
    </>
  );
}
export function CatalogScreen() {
  const params = useLocalSearchParams<{ type?: string; id?: string }>();
  const { region } = useRegion();
  const input = catalogDetailInput.safeParse({
    id: parseCatalogId(params.id),
    type: params.type,
    region,
  });
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['left', 'right', 'bottom']}>
      {input.success ? <CatalogQuery input={input.data} /> : <TitleNotFound />}
      <BottomNavigation />
    </SafeAreaView>
  );
}
