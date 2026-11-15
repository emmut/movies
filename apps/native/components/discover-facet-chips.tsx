import type { DiscoveryInput } from '@movies/api/discover';
import { useDiscoveryFacets } from '@movies/api/react/use-discovery-query';
import { XIcon } from '@native/components/icons';
import { facetFilters } from '@native/lib/discover-filters';
import { Pressable, ScrollView, Text, View } from 'react-native';

type Facet = (typeof facetFilters)[keyof typeof facetFilters];

function facetName(facet: Facet, id: number, names: { id: number; name: string }[] = []) {
  const match = names.find((item) => item.id === id);
  if (match) {
    return match.name;
  }
  return `${facet.kind} ${id}`;
}

function FacetChips({
  filter,
  facet,
  ids,
  change,
}: {
  filter: string;
  facet: Facet;
  ids: number[];
  change: (params: Record<string, string>) => void;
}) {
  const query = useDiscoveryFacets({ kind: facet.kind, ids, query: '' });
  return (
    <View className="flex-row gap-2">
      {ids.map((id) => {
        const name = facetName(facet, id, query.data);
        return (
          <Pressable
            key={id}
            accessibilityRole="button"
            accessibilityLabel={'Remove ' + name}
            className="bg-default min-h-11 flex-row items-center gap-2 rounded-xl border border-border px-3"
            onPress={() =>
              change({ [filter]: ids.filter((item) => item !== id).join('|'), page: '1' })
            }
          >
            <Text className="text-sm text-foreground">{name}</Text>
            <XIcon className="size-4 text-muted" accessible={false} />
          </Pressable>
        );
      })}
    </View>
  );
}

export function DiscoverFacetChips({
  input,
  change,
}: {
  input: DiscoveryInput;
  change: (params: Record<string, string>) => void;
}) {
  return (
    <ScrollView horizontal contentContainerClassName="gap-2" showsHorizontalScrollIndicator={false}>
      {Object.entries(facetFilters).map(([filter, facet]) => {
        const ids = input[facet.field];
        if (ids.length === 0) {
          return null;
        }
        return <FacetChips key={filter} filter={filter} facet={facet} ids={ids} change={change} />;
      })}
    </ScrollView>
  );
}
