import type { CatalogDetail } from '@movies/api/catalog';
import { CatalogArtwork } from '@native/components/catalog-artwork';
import { CatalogFacts, CatalogHeading, CatalogStats } from '@native/components/catalog-metadata';
import { CatalogProviders } from '@native/components/catalog-providers';
import { CatalogRelated } from '@native/components/catalog-related';
import { CatalogTrailer } from '@native/components/catalog-trailer';
import { ExternalLink } from '@native/components/external-link';
import { webUrl } from '@native/lib/connections';
import { useRememberedScroll } from '@native/lib/use-remembered-scroll';
import { ScrollView, Text, View } from 'react-native';

function Genres({ item }: { item: CatalogDetail }) {
  if (item.genres.length === 0) return null;
  return (
    <View className="gap-3">
      <Text accessibilityRole="header" className="text-xl font-semibold text-foreground">
        Genres
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {item.genres.map((genre) => (
          <ExternalLink
            key={genre.id}
            href={`${webUrl}/discover?genreId=${genre.id}&mediaType=${item.type}`}
          >
            {genre.name}
          </ExternalLink>
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
  } = useRememberedScroll(`${item.type}:${item.id}`);
  const input = { id: item.id, type: item.type, region };
  const noOverview =
    item.type === 'movie'
      ? 'No overview available for this movie.'
      : 'No overview available for this TV show.';
  return (
    <ScrollView
      ref={scrollRef}
      testID="catalog-scroll"
      onScroll={rememberScroll}
      onContentSizeChange={restoreScroll}
      onLayout={onLayout}
      onScrollBeginDrag={onScrollBeginDrag}
      scrollEventThrottle={16}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName="gap-8 pt-4 pb-12"
    >
      <CatalogArtwork item={item} />
      <View className="gap-6 px-4">
        <CatalogHeading item={item} region={region} />
        <CatalogStats item={item} />
        <CatalogTrailer input={{ id: item.id, type: item.type }} title={item.title} />
        <Genres item={item} />
        <View className="gap-3">
          <Text accessibilityRole="header" className="text-xl font-semibold text-foreground">
            Overview
          </Text>
          <Text className="text-base leading-relaxed text-foreground">
            {item.overview || noOverview}
          </Text>
        </View>
        <CatalogFacts item={item} />
        <CatalogProviders input={input} />
        <CatalogRelated input={input} kind="similar" />
        <CatalogRelated input={input} kind="recommendations" />
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
  );
}
