import type { CatalogDetail } from '@movies/api/catalog';
import { useCatalogImdb } from '@movies/api/react/use-catalog-query';
import { CatalogArtwork } from '@native/components/catalog-artwork';
import { CatalogCredits } from '@native/components/catalog-credits';
import { CatalogFacts, CatalogHeading, CatalogStats } from '@native/components/catalog-metadata';
import { CatalogOriginCountries } from '@native/components/catalog-origin-countries';
import { CatalogProviders } from '@native/components/catalog-providers';
import { CatalogRelated } from '@native/components/catalog-related';
import { CatalogReviews } from '@native/components/catalog-reviews';
import { CatalogSectionState } from '@native/components/catalog-section-state';
import { CatalogTrailer } from '@native/components/catalog-trailer';
import { CustomListActions } from '@native/components/custom-list-picker';
import { ExternalLink } from '@native/components/external-link';
import { PdpSections } from '@native/components/pdp-sections';
import { PersonCreditGroup } from '@native/components/person-credits';
import {
  ScrollNavigationProvider,
  useScrollNavigation,
} from '@native/components/scroll-navigation';
import { SystemListActions } from '@native/components/system-list-actions';
import { useRememberedScroll } from '@native/lib/use-remembered-scroll';
import { Link } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';

function Genres({ item, region }: { item: CatalogDetail; region: string }) {
  const navigationPress = useScrollNavigation();
  if (item.genres.length === 0) {
    return null;
  }
  return (
    <View className="gap-3">
      <Text accessibilityRole="header" className="text-xl font-semibold text-foreground">
        Genres
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {item.genres.map((genre) => (
          <Link
            key={genre.id}
            href={{
              pathname: '/discover',
              params: { genreId: String(genre.id), mediaType: item.type, watch_region: region },
            }}
            asChild
          >
            <Pressable
              {...navigationPress}
              accessibilityRole="link"
              accessibilityLabel={'Discover ' + genre.name}
              className="bg-default min-h-11 justify-center rounded-lg border border-border px-3"
            >
              <Text className="text-sm text-foreground">{genre.name}</Text>
            </Pressable>
          </Link>
        ))}
      </View>
    </View>
  );
}

export function CatalogContent({ item, region }: { item: CatalogDetail; region: string }) {
  const imdb = useCatalogImdb({ id: item.id, type: item.type });
  const {
    ref: scrollRef,
    onScroll: rememberScroll,
    onContentSizeChange: restoreScroll,
    onLayout,
    onScrollBeginDrag,
    captureBeforeNavigation,
    cancelBeforeNavigation,
  } = useRememberedScroll('catalog:' + item.type + ':' + item.id, 'entry');
  const input = { id: item.id, type: item.type, region };
  return (
    <ScrollNavigationProvider capture={captureBeforeNavigation} cancel={cancelBeforeNavigation}>
      <ScrollView
        ref={scrollRef}
        testID="catalog-scroll"
        onScroll={rememberScroll}
        onContentSizeChange={restoreScroll}
        onLayout={onLayout}
        onScrollBeginDrag={onScrollBeginDrag}
        onTouchMove={onScrollBeginDrag}
        scrollEventThrottle={16}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="gap-8 pt-4 pb-12"
      >
        <CatalogArtwork item={item} />
        <View className="gap-6 px-4">
          <CatalogHeading item={item} region={region} />
          <CatalogRating item={item} query={imdb} />
          <SystemListActions input={{ resourceId: item.id, resourceType: item.type }} />
          <CustomListActions input={{ resourceId: item.id, resourceType: item.type }} />
          <CatalogTrailer input={{ id: item.id, type: item.type }} title={item.title} />
          <Genres item={item} region={region} />
          <CatalogOriginCountries item={item} region={region} />
          <Overview item={item} />
          <CatalogFacts item={item} />
          <PdpSections input={input} title={item.title} />
          <Creators item={item} region={region} />
          <PdpSections input={input} title={item.title} part="seasons" />
          <CatalogCredits input={input} />
          <CatalogProviders input={input} />
          <PdpSections input={input} title={item.title} part="availability" />
          <CatalogRelated input={input} kind="similar" />
          <CatalogRelated input={input} kind="recommendations" />
          <CatalogReviews input={input} />
          <SourceLinks item={item} imdbUrl={imdb.data?.url} />
        </View>
      </ScrollView>
    </ScrollNavigationProvider>
  );
}

function CatalogRating({
  item,
  query,
}: {
  item: CatalogDetail;
  query: ReturnType<typeof useCatalogImdb>;
}) {
  const { rating, ratingUnavailable } = query.data ?? {};
  return (
    <>
      <CatalogStats item={item} imdb={rating} />
      <CatalogSectionState
        label="IMDb rating"
        pending={query.isFetching && ratingUnavailable === true}
        failed={query.isError || ratingUnavailable === true}
        retry={() => {
          void query.refetch();
        }}
      />
    </>
  );
}
function Overview({ item }: { item: CatalogDetail }) {
  const noOverview =
    item.type === 'movie'
      ? 'No overview available for this movie.'
      : 'No overview available for this TV show.';
  return (
    <View className="gap-3">
      <Text accessibilityRole="header" className="text-xl font-semibold text-foreground">
        Overview
      </Text>
      <Text className="text-base leading-relaxed text-foreground">
        {item.overview || noOverview}
      </Text>
    </View>
  );
}
function Creators({ item, region }: { item: CatalogDetail; region: string }) {
  if (item.type !== 'tv') {
    return null;
  }
  return <PersonCreditGroup title="Created By" people={item.creators} compact region={region} />;
}
function SourceLinks({ item, imdbUrl }: { item: CatalogDetail; imdbUrl?: string | null }) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {imdbUrl ? (
        <ExternalLink href={imdbUrl} prominent>
          IMDb
        </ExternalLink>
      ) : null}
      <ExternalLink href={`https://www.themoviedb.org/${item.type}/${item.id}`}>TMDB</ExternalLink>
      {item.homepage ? <ExternalLink href={item.homepage}>Official website</ExternalLink> : null}
    </View>
  );
}
