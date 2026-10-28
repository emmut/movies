import type { CatalogDetail } from '@movies/api/catalog';
import { CatalogArtwork } from '@native/components/catalog-artwork';
import { CatalogCredits } from '@native/components/catalog-credits';
import { CatalogFacts, CatalogHeading, CatalogStats } from '@native/components/catalog-metadata';
import { CatalogOriginCountries } from '@native/components/catalog-origin-countries';
import { CatalogProviders } from '@native/components/catalog-providers';
import { CatalogRelated } from '@native/components/catalog-related';
import { CatalogReviews } from '@native/components/catalog-reviews';
import { CatalogTrailer } from '@native/components/catalog-trailer';
import { ExternalLink } from '@native/components/external-link';
import { PersonCreditGroup } from '@native/components/person-credits';
import {
  ScrollNavigationProvider,
  useScrollNavigation,
} from '@native/components/scroll-navigation';
import { SystemListActions } from '@native/components/system-list-actions';
import { useRememberedScroll } from '@native/lib/use-remembered-scroll';
import { Link } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';

function Genres({ item }: { item: CatalogDetail }) {
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
              params: { genreId: String(genre.id), mediaType: item.type },
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
  const noOverview =
    item.type === 'movie'
      ? 'No overview available for this movie.'
      : 'No overview available for this TV show.';
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
          <CatalogStats item={item} />
          <SystemListActions input={{ resourceId: item.id, resourceType: item.type }} />
          <CatalogTrailer input={{ id: item.id, type: item.type }} title={item.title} />
          <Genres item={item} />
          <CatalogOriginCountries item={item} region={region} />
          <View className="gap-3">
            <Text accessibilityRole="header" className="text-xl font-semibold text-foreground">
              Overview
            </Text>
            <Text className="text-base leading-relaxed text-foreground">
              {item.overview || noOverview}
            </Text>
          </View>
          <CatalogFacts item={item} />
          {item.type === 'tv' ? (
            <PersonCreditGroup
              title="Created By"
              people={item.creators ?? []}
              compact
              region={region}
            />
          ) : null}
          <CatalogCredits input={input} />
          <CatalogProviders input={input} />
          <CatalogRelated input={input} kind="similar" />
          <CatalogRelated input={input} kind="recommendations" />
          <CatalogReviews input={input} />
          <View className="flex-row flex-wrap gap-2">
            <ExternalLink href={`https://www.themoviedb.org/${item.type}/${item.id}`}>
              TMDB
            </ExternalLink>
            {item.homepage ? (
              <ExternalLink href={item.homepage}>Official website</ExternalLink>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </ScrollNavigationProvider>
  );
}
