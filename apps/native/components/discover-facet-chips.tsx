import type { DiscoveryInput } from '@movies/api/discover';
import { XIcon } from '@native/components/icons';
import { useDiscoveryFacets } from '@native/hooks/use-discovery-query';
import { facetFilters } from '@native/lib/discover-filters';
import { Pressable, ScrollView, Text, View } from 'react-native';

function FacetChips({
  filter,
  ids,
  change,
}: {
  filter: keyof typeof facetFilters;
  ids: number[];
  change: (params: Record<string, string>) => void;
}) {
  const facet = facetFilters[filter];
  const query = useDiscoveryFacets({ kind: facet.kind, ids, query: '' });
  return (
    <View className="flex-row gap-2">
      {ids.map((id) => {
        const name = query.data?.find((item) => item.id === id)?.name ?? `${facet.kind} ${id}`;
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
      {(Object.keys(facetFilters) as (keyof typeof facetFilters)[]).map((filter) => {
        const ids = input[facetFilters[filter].field];
        return ids.length ? (
          <FacetChips key={filter} filter={filter} ids={ids} change={change} />
        ) : null;
      })}
    </ScrollView>
  );
}
