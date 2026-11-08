import type { DiscoveryInput, DiscoveryOptions } from '@movies/api/discover';
import { ChoiceSheet } from '@native/components/choice-sheet';
import { DiscoverFilterMenu } from '@native/components/discover-filter-menu';
import { filterSpec, activeDiscoverFilterCount, type Filter } from '@native/lib/discover-filters';
import { toggleSelection } from '@native/lib/discover-state';
import { useState } from 'react';
import { View } from 'react-native';

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
    if (!open) {
      return;
    }
    const current = filterSpec(open, input, data);
    const values = current.multiple
      ? toggleSelection(current.selected, value, current.maxSelections)
      : [value];
    change({ [open]: values.join('|'), page: '1' });
    if (!current.multiple) {
      setOpen(null);
    }
  }
  const count = activeDiscoverFilterCount(input);
  const label = count > 0 ? `Filters (${count})` : 'Filters';
  const choices = filters.map((filter) => {
    const item = filterSpec(filter, input, data);
    const summary =
      item.options
        .filter((option) => item.selected.includes(option.value))
        .map((option) => option.label)
        .join(', ') || 'Any';
    return { filter, title: item.title, summary };
  });

  function clear() {
    change({
      genreId: '',
      sort_by: '',
      runtime: '',
      with_origin_country: '',
      with_watch_providers: '',
      watch_region: '',
      page: '1',
    });
  }

  return (
    <View>
      <DiscoverFilterMenu label={label} choices={choices} onSelect={setOpen} onClear={clear} />
      {spec ? <ChoiceSheet {...spec} onSelect={select} onClose={() => setOpen(null)} /> : null}
    </View>
  );
}
