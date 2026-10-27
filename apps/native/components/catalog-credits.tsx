import type { CatalogDetailInput } from '@movies/api/catalog';
import type { CreditPerson } from '@movies/api/catalog-support';
import { CatalogSectionState } from '@native/components/catalog-section-state';
import { UsersIcon } from '@native/components/icons';
import { useScrollNavigation } from '@native/components/scroll-navigation';
import { orpc } from '@native/lib/api';
import { catalogPath } from '@native/lib/catalog-navigation';
import { useQuery } from '@tanstack/react-query';
import { Image as NativeImage } from 'expo-image';
import { Link, usePathname } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { withUniwind } from 'uniwind';

const Image = withUniwind(NativeImage);

function Portrait({ person, compact }: { person: CreditPerson; compact: boolean }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showImage = person.profileUrl !== null && person.profileUrl !== failedUrl;
  return (
    <View
      className={`items-center justify-center overflow-hidden bg-zinc-800 ${compact ? 'size-10 rounded-full' : 'aspect-2/3 w-32 rounded-lg'}`}
    >
      {showImage ? (
        <Image
          source={person.profileUrl}
          contentFit="cover"
          className="size-full"
          accessibilityLabel={'Profile image of ' + person.name}
          onError={() => setFailedUrl(person.profileUrl)}
        />
      ) : (
        <UsersIcon className="size-6 text-zinc-400" accessibilityLabel="No photo available" />
      )}
    </View>
  );
}

function PersonCredit({
  person,
  compact,
  region,
}: {
  person: CreditPerson;
  compact: boolean;
  region: string;
}) {
  const pathname = usePathname();
  const navigationPress = useScrollNavigation();
  return (
    <Link
      href={{ pathname: catalogPath(pathname), params: { type: 'person', id: person.id, region } }}
      asChild
    >
      <Pressable
        {...navigationPress}
        accessibilityRole="link"
        accessibilityLabel={`Open ${person.name}, ${person.role || 'Person'}`}
        className={
          compact
            ? 'bg-default min-h-14 flex-row items-center gap-3 rounded-lg border border-border p-3'
            : 'w-32 gap-2'
        }
      >
        <Portrait person={person} compact={compact} />
        <View className={compact ? 'flex-1 gap-1' : 'gap-1'}>
          <Text numberOfLines={2} className="text-sm font-medium text-foreground">
            {person.name}
          </Text>
          {person.role ? (
            <Text numberOfLines={2} className="text-xs text-muted">
              {person.role}
            </Text>
          ) : null}
        </View>
      </Pressable>
    </Link>
  );
}

function Separator() {
  return <View className="w-4" />;
}

function CreditGroup({
  title,
  people,
  compact = false,
  region,
}: {
  title: string;
  people: CreditPerson[];
  compact?: boolean;
  region: string;
}) {
  if (people.length === 0) {
    return null;
  }
  return (
    <View className="gap-3">
      <Text accessibilityRole="header" className="text-xl font-semibold text-foreground">
        {title}
      </Text>
      {compact ? (
        <View className="gap-3">
          {people.map((person) => (
            <PersonCredit key={person.creditId} person={person} compact region={region} />
          ))}
        </View>
      ) : (
        <FlatList
          horizontal
          data={people}
          renderItem={({ item }) => <PersonCredit person={item} compact={false} region={region} />}
          keyExtractor={(person) => person.creditId}
          ItemSeparatorComponent={Separator}
          showsHorizontalScrollIndicator={false}
          initialNumToRender={4}
          maxToRenderPerBatch={4}
          accessibilityLabel="Cast"
        />
      )}
    </View>
  );
}

export function CatalogCredits({ input }: { input: CatalogDetailInput }) {
  const query = useQuery(
    orpc.catalog.credits.queryOptions({ input: { id: input.id, type: input.type }, retry: false }),
  );
  if (query.data && Object.values(query.data).every((people) => people.length === 0)) {
    return null;
  }
  return (
    <View className="gap-6">
      <CatalogSectionState
        label="credits"
        pending={query.isPending}
        failed={query.isError}
        retry={() => {
          void query.refetch();
        }}
      />
      {query.data ? (
        <>
          <CreditGroup
            title="Directors"
            people={query.data.directors}
            compact
            region={input.region}
          />
          <CreditGroup title="Writers" people={query.data.writers} compact region={input.region} />
          <CreditGroup title="Cast" people={query.data.cast} region={input.region} />
        </>
      ) : null}
    </View>
  );
}
