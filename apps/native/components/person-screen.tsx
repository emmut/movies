import { parseCatalogId } from '@movies/api/catalog';
import type { PersonCredit } from '@movies/api/person';
import { personInput, type PersonDetail } from '@movies/api/person';
import { BottomNavigation } from '@native/components/bottom-navigation';
import { CustomListActions } from '@native/components/custom-list-picker';
import { ExternalLink } from '@native/components/external-link';
import { FactGrid } from '@native/components/fact-grid';
import { DetailSkeleton } from '@native/components/loading-skeletons';
import { MediaBadge } from '@native/components/media-badge';
import { PersonFilmography, PersonKnownFor } from '@native/components/person-filmography';
import { ScrollNavigationProvider } from '@native/components/scroll-navigation';
import { StatGrid } from '@native/components/stat-grid';
import { usePersonCredits, usePersonDetails } from '@native/hooks/use-person-query';
import { personCreditCount, personFacts, personStats } from '@native/lib/person-model';
import { useRegion } from '@native/lib/preferences';
import { regionOr } from '@native/lib/search-params';
import { useRememberedScroll } from '@native/lib/use-remembered-scroll';
import { type UseQueryResult } from '@tanstack/react-query';
import { Image as NativeImage } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView as NativeSafeAreaView } from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';

const Image = withUniwind(NativeImage);
const SafeAreaView = withUniwind(NativeSafeAreaView);

function PersonArtwork({ person }: { person: PersonDetail }) {
  return (
    <View className="bg-default aspect-2/3 w-56 self-center overflow-hidden rounded-lg border border-border">
      {person.profileUrl ? (
        <Image
          source={person.profileUrl}
          contentFit="cover"
          className="size-full"
          accessibilityLabel={'Profile image of ' + person.name}
        />
      ) : (
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted">No Photo Available</Text>
        </View>
      )}
    </View>
  );
}
function PersonSources({ person }: { person: PersonDetail }) {
  return (
    <View className="flex-row flex-wrap gap-2">
      <ExternalLink href={'https://www.themoviedb.org/person/' + person.id}>TMDB</ExternalLink>
      {person.imdbUrl ? (
        <ExternalLink href={person.imdbUrl} prominent>
          IMDb
        </ExternalLink>
      ) : null}
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
  movie: UseQueryResult<PersonCredit[]>;
  tv: UseQueryResult<PersonCredit[]>;
}) {
  if (!movie.isSuccess || !tv.isSuccess) {
    return <StatGrid stats={personStats(person, undefined)} />;
  }
  const credits = personCreditCount(movie.data, tv.data);
  return <StatGrid stats={personStats(person, credits)} />;
}
function PersonContent({ person, region }: { person: PersonDetail; region: string }) {
  const movie = usePersonCredits({ id: person.id, type: 'movie' });
  const tv = usePersonCredits({ id: person.id, type: 'tv' });
  const {
    ref,
    onScroll,
    onLayout,
    onScrollBeginDrag,
    onContentSizeChange,
    captureBeforeNavigation,
    cancelBeforeNavigation,
  } = useRememberedScroll('person:' + person.id, 'entry');
  return (
    <ScrollNavigationProvider capture={captureBeforeNavigation} cancel={cancelBeforeNavigation}>
      <ScrollView
        testID="person-scroll"
        className="flex-1"
        ref={ref}
        onScroll={onScroll}
        onLayout={onLayout}
        onScrollBeginDrag={onScrollBeginDrag}
        onTouchMove={onScrollBeginDrag}
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
        <CustomListActions input={{ resourceId: person.id, resourceType: 'person' }} />
        <PersonStatistics person={person} movie={movie} tv={tv} />
        <PersonKnownFor titles={[...(movie.data ?? []), ...(tv.data ?? [])]} region={region} />
        <View className="gap-3">
          <Text accessibilityRole="header" className="text-xl font-semibold text-foreground">
            Biography
          </Text>
          <Text className="text-base leading-6 text-foreground">
            {person.biography || 'No biography available.'}
          </Text>
        </View>
        <FactGrid facts={personFacts(person)} />
        <PersonFilmography title="Movies" query={movie} region={region} />
        <PersonFilmography title="TV Shows" query={tv} region={region} />
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
        className="bg-default min-h-11 justify-center rounded-xl px-4"
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
        className="bg-default min-h-11 justify-center rounded-xl px-4"
        onPress={() => {
          void retry();
        }}
      >
        <Text className="font-semibold text-foreground">Try again</Text>
      </Pressable>
    </View>
  );
}

function PersonQuery({ id, region }: { id: number; region: string }) {
  const query = usePersonDetails({ id });
  if (query.isPending) {
    return <DetailSkeleton label="Loading person" />;
  }
  if (query.isError) {
    return <PersonLoadError error={query.error} retry={query.refetch} />;
  }
  return (
    <>
      <Stack.Screen options={{ title: query.data.name }} />
      <PersonContent person={query.data} region={region} />
    </>
  );
}
export function PersonScreen() {
  const params = useLocalSearchParams<{ id?: string; region?: string }>();
  const region = useRegion();
  const input = personInput.safeParse({ id: parseCatalogId(params.id) });
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['left', 'right']} collapsable={false}>
      {input.success ? (
        <PersonQuery id={input.data.id} region={regionOr(params.region, region)} />
      ) : (
        <PersonNotFound />
      )}
      <BottomNavigation />
    </SafeAreaView>
  );
}
