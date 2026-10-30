import type { CatalogDetailInput } from '@movies/api/catalog';
import type { CollectionPage, PdpExtras } from '@movies/api/pdp';
import { CatalogSectionState } from '@native/components/catalog-section-state';
import { PdpMedia, PdpImage } from '@native/components/pdp-media';
import { useScrollNavigation } from '@native/components/scroll-navigation';
import { orpc } from '@native/lib/api';
import { catalogPath } from '@native/lib/catalog-navigation';
import { useQuery } from '@tanstack/react-query';
import { Link, usePathname } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';

function CollectionParts({ parts, region }: { parts: CollectionPage['parts']; region: string }) {
  const pathname = usePathname();
  const navigation = useScrollNavigation();
  return (
    <ScrollView horizontal contentContainerClassName="gap-4">
      {parts.map((part) => (
        <Link
          key={part.id}
          href={{ pathname: catalogPath(pathname), params: { id: part.id, type: 'movie', region } }}
          asChild
        >
          <Pressable
            {...navigation}
            accessibilityRole="link"
            accessibilityLabel={'Open ' + part.title + ', Movie'}
            className="w-36 gap-2"
          >
            <View className="aspect-2/3 w-full overflow-hidden rounded-xl border border-border">
              <PdpImage path={part.poster_path} title={part.title} />
            </View>
            <Text numberOfLines={2} className="font-semibold text-foreground">
              {part.title}
            </Text>
            <Text className="text-sm text-muted">{part.release_date.slice(0, 4) || 'TBA'}</Text>
          </Pressable>
        </Link>
      ))}
    </ScrollView>
  );
}
function Collection({ id, region }: { id: number; region: string }) {
  const query = useQuery(orpc.catalog.collection.queryOptions({ input: { id }, retry: false }));
  return (
    <View className="gap-3">
      <CatalogSectionState
        label="collection"
        pending={query.isPending}
        failed={query.isError}
        retry={() => {
          void query.refetch();
        }}
      />
      {query.data ? (
        <>
          <Text accessibilityRole="header" className="text-xl font-semibold text-foreground">
            {query.data.name}
          </Text>
          <CollectionParts parts={query.data.parts} region={region} />
        </>
      ) : null}
    </View>
  );
}
function Seasons({ data, input }: { data: PdpExtras; input: CatalogDetailInput }) {
  const pathname = usePathname();
  const navigation = useScrollNavigation();
  function href(season: number) {
    return {
      pathname: `${catalogPath(pathname)}/season/[season]` as const,
      params: { id: input.id, type: 'tv', season, region: input.region },
    };
  }
  if (!data.seasons.length && !data.next && !data.latest) {
    return null;
  }
  return (
    <View className="gap-4">
      <Text accessibilityRole="header" className="text-xl font-semibold text-foreground">
        Seasons &amp; Episodes ({data.seasons.length})
      </Text>
      {[
        ['Next Episode', data.next],
        ['Latest Episode', data.latest],
      ].map(([label, episode]) =>
        typeof episode === 'object' && episode ? (
          <Link key={String(label)} href={href(episode.season_number)} asChild>
            <Pressable
              {...navigation}
              accessibilityRole="link"
              className="bg-default gap-2 rounded-xl border border-border p-4"
            >
              <Text className="text-sm text-muted">{String(label)}</Text>
              <Text className="font-semibold text-foreground">
                Season {episode.season_number}, episode {episode.episode_number}
              </Text>
              <Text className="text-sm text-muted">{episode.air_date || 'Air date TBA'}</Text>
            </Pressable>
          </Link>
        ) : null,
      )}
      <ScrollView horizontal contentContainerClassName="gap-4">
        {data.seasons.map((season) => (
          <Link key={season.id} href={href(season.season_number)} asChild>
            <Pressable
              {...navigation}
              accessibilityRole="link"
              accessibilityLabel={'Open ' + season.name}
              className="w-36 gap-2"
            >
              <View className="aspect-2/3 w-full overflow-hidden rounded-xl border border-border">
                <PdpImage path={season.poster_path} title={season.name} />
              </View>
              <Text className="font-semibold text-foreground">{season.name}</Text>
              <Text className="text-sm text-muted">
                {season.episode_count} episodes · {season.air_date?.slice(0, 4) || 'TBA'}
              </Text>
            </Pressable>
          </Link>
        ))}
      </ScrollView>
    </View>
  );
}
function Companies({ items }: { items: PdpExtras['companies'] }) {
  if (!items.length) {
    return null;
  }
  return (
    <View className="gap-2">
      <Text accessibilityRole="header" className="text-xl font-semibold text-foreground">
        Production Companies
      </Text>
      <Text className="text-base text-muted">{items.map((item) => item.name).join(', ')}</Text>
    </View>
  );
}
function Keywords({ items, input }: { items: PdpExtras['keywords']; input: CatalogDetailInput }) {
  const pathname = usePathname();
  const navigation = useScrollNavigation();
  const prefix = catalogPath(pathname).replace('/[type]/[id]', '');
  if (!items.length) {
    return null;
  }
  return (
    <View className="gap-3">
      <Text accessibilityRole="header" className="text-xl font-semibold text-foreground">
        Themes &amp; Keywords
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {items.map((item) => (
          <Link
            key={item.id}
            href={{
              pathname: `${prefix}/keyword/[keywordId]` as '/keyword/[keywordId]',
              params: { keywordId: item.id, mediaType: input.type, region: input.region },
            }}
            asChild
          >
            <Pressable
              {...navigation}
              accessibilityRole="link"
              className="bg-default min-h-11 justify-center rounded-full border border-border px-4"
            >
              <Text className="text-sm text-foreground">{item.name}</Text>
            </Pressable>
          </Link>
        ))}
      </View>
    </View>
  );
}
function Releases({ items, region }: { items: PdpExtras['releases']; region: string }) {
  if (!items.length) {
    return null;
  }
  return (
    <View className="gap-3">
      <Text accessibilityRole="header" className="text-xl font-semibold text-foreground">
        Release Dates · {region}
      </Text>
      {items.map((release) => (
        <View key={release.key} className="flex-row justify-between gap-4">
          <Text className="text-muted">{release.label}</Text>
          <Text className="text-foreground">{release.date}</Text>
        </View>
      ))}
    </View>
  );
}
function Availability({ data, region }: { data: PdpExtras; region: string }) {
  return (
    <View className="gap-6">
      {data.collection ? <Collection id={data.collection.id} region={region} /> : null}
      <Releases items={data.releases} region={region} />
    </View>
  );
}
export function PdpSections({
  input,
  title,
  part = 'details',
}: {
  input: CatalogDetailInput;
  title: string;
  part?: 'details' | 'seasons' | 'availability';
}) {
  const query = useQuery(orpc.catalog.extras.queryOptions({ input, retry: false }));
  const data = query.data;
  if (part === 'seasons') {
    return data && input.type === 'tv' ? <Seasons data={data} input={input} /> : null;
  }
  if (part === 'availability') {
    return data ? <Availability data={data} region={input.region} /> : null;
  }
  return (
    <View className="gap-6">
      <CatalogSectionState
        label="additional title information"
        pending={query.isPending}
        failed={query.isError}
        retry={() => {
          void query.refetch();
        }}
      />
      {data ? (
        <>
          <Companies items={data.companies} />
          <Keywords items={data.keywords} input={input} />
          <PdpMedia data={data} title={title} />
        </>
      ) : null}
    </View>
  );
}
