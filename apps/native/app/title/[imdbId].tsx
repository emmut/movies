import { imdbIdSchema } from '@movies/api/imdb';
import { ScreenQueryState } from '@native/components/screen-query-state';
import { useCatalogResolveImdb } from '@native/hooks/use-catalog-query';
import { Link, Redirect, Stack, useLocalSearchParams } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

function UnavailableTitle() {
  return (
    <View className="flex-1 justify-center gap-4 bg-background p-4">
      <Text accessibilityRole="header" className="text-2xl font-bold text-foreground">
        Title not found
      </Text>
      <Text className="text-base text-muted">
        This IMDb title could not be found in the catalog.
      </Text>
      <Link href="/search" asChild>
        <Pressable
          accessibilityRole="link"
          className="bg-default min-h-12 justify-center self-start rounded-xl px-4"
        >
          <Text className="font-semibold text-foreground">Search titles</Text>
        </Pressable>
      </Link>
    </View>
  );
}

function ResolveTitle({ imdbId }: { imdbId: string }) {
  const query = useCatalogResolveImdb({ imdbId });
  if (query.isPending || query.isError) {
    return (
      <ScreenQueryState
        label="title"
        failed={query.isError}
        retry={() => {
          void query.refetch();
        }}
      />
    );
  }
  if (!query.data) {
    return <UnavailableTitle />;
  }
  return <Redirect href={{ pathname: '/[type]/[id]', params: query.data }} />;
}

export default function ImdbTitle() {
  const params = useLocalSearchParams<{ imdbId?: string }>();
  const id = imdbIdSchema.safeParse(params.imdbId);
  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ title: 'Title' }} />
      {id.success ? <ResolveTitle imdbId={id.data} /> : <UnavailableTitle />}
    </View>
  );
}
