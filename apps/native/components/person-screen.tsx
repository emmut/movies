import { parseCatalogId } from '@movies/api/catalog';
import type { MediaCard } from '@movies/api/home';
import { personInput, type PersonDetail } from '@movies/api/person';
import { BottomNavigation } from '@native/components/bottom-navigation';
import { CatalogSectionState } from '@native/components/catalog-section-state';
import { ExternalLink } from '@native/components/external-link';
import { FactGrid } from '@native/components/fact-grid';
import { MediaBadge } from '@native/components/media-badge';
import { MediaPosterRow } from '@native/components/media-poster';
import { ScrollNavigationProvider } from '@native/components/scroll-navigation';
import { StatGrid } from '@native/components/stat-grid';
import { orpc } from '@native/lib/api';
import { personCreditCount, personFacts, personStats } from '@native/lib/person-model';
import { useRememberedScroll } from '@native/lib/use-remembered-scroll';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { Image as NativeImage } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView as NativeSafeAreaView } from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';

const Image = withUniwind(NativeImage);
const SafeAreaView = withUniwind(NativeSafeAreaView);

function PersonFilmography({
  title,
  query,
}: {
  title: string;
  query: UseQueryResult<MediaCard[]>;
}) {
  if (query.data?.length === 0) {
    return null;
  }
  return (
    <View className="gap-3">
      <Text accessibilityRole="header" className="text-xl font-semibold text-foreground">
        {title}
      </Text>
      <CatalogSectionState
        label={title}
        pending={query.isPending}
        failed={query.isError}
        retry={() => {
          void query.refetch();
        }}
      />
      {query.data ? <MediaPosterRow items={query.data} /> : null}
    </View>
  );
}
function PersonArtwork({ person }: { person: PersonDetail }) {
  return (
    <View className="aspect-2/3 w-56 self-center overflow-hidden rounded-lg border border-border bg-zinc-800">
      {person.profileUrl ? (
        <Image
          source={person.profileUrl}
          contentFit="cover"
          className="size-full"
          accessibilityLabel={'Profile image of ' + person.name}
        />
      ) : (
        <View className="flex-1 items-center justify-center">
          <Text className="text-zinc-400">No Photo Available</Text>
        </View>
      )}
    </View>
  );
}
function PersonSources({ person }: { person: PersonDetail }) {
  return (
    <View className="flex-row flex-wrap gap-2">
      <ExternalLink href={'https://www.themoviedb.org/person/' + person.id}>TMDB</ExternalLink>
      {person.imdbUrl ? <ExternalLink href={person.imdbUrl}>IMDb</ExternalLink> : null}
      {person.homepage ? (
        <ExternalLink href={person.homepage}>Official website</ExternalLink>
      ) : null}
    </View>
  );
}

function PersonStatistics({
  person,
  movie,
  tv,
}: {
  person: PersonDetail;
  movie: UseQueryResult<MediaCard[]>;
  tv: UseQueryResult<MediaCard[]>;
}) {
  if (movie.isPending || tv.isPending) {
    return <StatGrid stats={personStats(person, undefined)} />;
  }
  const credits = personCreditCount(movie.data, tv.data);
  return <StatGrid stats={personStats(person, credits)} />;
}
function PersonContent({ person }: { person: PersonDetail }) {
  const movie = useQuery(
    orpc.person.credits.queryOptions({ input: { id: person.id, type: 'movie' }, retry: false }),
  );
  const tv = useQuery(
    orpc.person.credits.queryOptions({ input: { id: person.id, type: 'tv' }, retry: false }),
  );
  const {
    ref,
    onScroll,
    onLayout,
    onScrollBeginDrag,
    onContentSizeChange,
    captureBeforeNavigation,
  } = useRememberedScroll('person:' + person.id, 'entry');
  return (
    <ScrollNavigationProvider capture={captureBeforeNavigation}>
      <ScrollView
        testID="person-scroll"
        className="flex-1"
        ref={ref}
        onScroll={onScroll}
        onLayout={onLayout}
        onScrollBeginDrag={onScrollBeginDrag}
        onContentSizeChange={onContentSizeChange}
        scrollEventThrottle={16}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="gap-7 p-4 pb-12"
      >
        <PersonArtwork person={person} />
        <View className="gap-3">
          <Text accessibilityRole="header" className="text-3xl font-bold text-foreground">
            {person.name}
          </Text>
          <View className="self-start">
            <MediaBadge type="person" />
          </View>
        </View>
        <PersonStatistics person={person} movie={movie} tv={tv} />
        <View className="gap-3">
          <Text accessibilityRole="header" className="text-xl font-semibold text-foreground">
            Biography
          </Text>
          <Text className="text-base leading-6 text-foreground">
            {person.biography || 'No biography available.'}
          </Text>
        </View>
        <FactGrid facts={personFacts(person)} />
        <PersonFilmography title="Movies" query={movie} />
        <PersonFilmography title="TV Shows" query={tv} />
        <PersonSources person={person} />
      </ScrollView>
    </ScrollNavigationProvider>
  );
}
function PersonNotFound() {
  const router = useRouter();
  return (
    <View className="flex-1 items-start justify-center gap-4 p-5">
      <Text accessibilityRole="header" className="text-2xl font-bold text-foreground">
        Person not found
      </Text>
      <Pressable
        accessibilityRole="button"
        className="min-h-11 justify-center rounded-xl bg-default px-4"
        onPress={() => router.replace('/')}
      >
        <Text className="font-semibold text-foreground">Go to Home</Text>
      </Pressable>
    </View>
  );
}
function PersonLoadError({ error, retry }: { error: Error; retry: () => Promise<unknown> }) {
  if ('code' in error && error.code === 'NOT_FOUND') {
    return <PersonNotFound />;
  }
  return (
    <View className="flex-1 items-start justify-center gap-3 p-5">
      <Text className="text-foreground">Couldn’t load this person.</Text>
      <Pressable
        accessibilityRole="button"
        className="min-h-11 justify-center rounded-xl bg-default px-4"
        onPress={() => {
          void retry();
        }}
      >
        <Text className="font-semibold text-foreground">Try again</Text>
      </Pressable>
    </View>
  );
}

function PersonQuery({ id }: { id: number }) {
  const query = useQuery(orpc.person.details.queryOptions({ input: { id }, retry: false }));
  if (query.isPending) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator accessibilityLabel="Loading person" />
      </View>
    );
  }
  if (query.isError) {
    return <PersonLoadError error={query.error} retry={query.refetch} />;
  }
  return (
    <>
      <Stack.Screen options={{ title: query.data.name }} />
      <PersonContent person={query.data} />
    </>
  );
}
export function PersonScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const input = personInput.safeParse({ id: parseCatalogId(params.id) });
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['left', 'right']} collapsable={false}>
      {input.success ? <PersonQuery id={input.data.id} /> : <PersonNotFound />}
      <BottomNavigation />
    </SafeAreaView>
  );
}
