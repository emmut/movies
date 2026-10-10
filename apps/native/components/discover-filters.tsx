import type { DiscoveryInput, DiscoveryOptions } from '@movies/api/discover';
import { ChoiceSheet } from '@native/components/choice-sheet';
import { filterSpec, type Filter } from '@native/lib/discover-filters';
import { toggleSelection } from '@native/lib/discover-state';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

const filters: Filter[] = [
  'genreId',
  'sort_by',
  'runtime',
  'with_origin_country',
  'with_watch_providers',
  'watch_region',
];

export function DiscoverFilters({
  input,
  data,
  change,
}: {
  input: DiscoveryInput;
  data: DiscoveryOptions;
  change: (params: Record<string, string>) => void;
}) {
  const [open, setOpen] = useState<Filter | null>(null);
  const spec = open ? filterSpec(open, input, data) : null;
  function select(value: string) {
    if (!open) return;
    const current = filterSpec(open, input, data);
    const values = current.multiple ? toggleSelection(current.selected, value) : [value];
    change({ [open]: values.join('|'), page: '1' });
    if (!current.multiple) setOpen(null);
  }
  return (
    <View className="gap-3">
      <View className="flex-row flex-wrap gap-2">
        {filters.map((filter) => {
          const item = filterSpec(filter, input, data);
          return (
            <Pressable
              key={filter}
              accessibilityRole="button"
              accessibilityLabel={item.title}
              className="min-h-11 justify-center rounded-xl border border-border bg-default px-3"
              onPress={() => setOpen(filter)}
            >
              <Text className="text-foreground">{item.title}</Text>
              <Text numberOfLines={1} className="text-xs text-muted">
                {item.options
                  .filter((option) => item.selected.includes(option.value))
                  .map((option) => option.label)
                  .join(', ') || 'Any'}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Pressable
        accessibilityRole="button"
        className="min-h-11 justify-center self-start px-2"
        onPress={() =>
          change({
            genreId: '',
            sort_by: '',
            runtime: '',
            with_origin_country: '',
            with_watch_providers: '',
            watch_region: '',
            page: '1',
          })
        }
      >
        <Text className="font-semibold text-foreground">Clear all filters</Text>
      </Pressable>
      {open && spec ? (
        <ChoiceSheet {...spec} onSelect={select} onClose={() => setOpen(null)} />
      ) : null}
    </View>
  );
}
