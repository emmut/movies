import type { DiscoveryInput, DiscoveryOptions } from '@movies/api/discover';
import { ChoiceSheet } from '@native/components/choice-sheet';
import { DiscoverFacetSheet } from '@native/components/discover-facet-sheet';
import { DiscoverFilterMenu } from '@native/components/discover-filter-menu';
import {
  filterSpec,
  activeDiscoverFilterCount,
  facetFilters,
  isFacetFilter,
  type Filter,
  type FilterSpec,
} from '@native/lib/discover-filters';
import { toggleSelection } from '@native/lib/discover-state';
import { useState } from 'react';
import { View } from 'react-native';

const filters: Filter[] = [
  'genreId',
  'keywordId',
  'companyId',
  'networkId',
  'sort_by',
  'runtime',
  'with_origin_country',
  'with_watch_providers',
  'watch_region',
];

function selectionSummary(spec: FilterSpec) {
  const labels = spec.options
    .filter((option) => spec.selected.includes(option.value))
    .map((option) => option.label);
  if (labels.length === 0) {
    return 'Any';
  }
  return labels.join(', ');
}

function DiscoverFilterSheet({
  open,
  input,
  data,
  onSelect,
  onClose,
}: {
  open: Filter | null;
  input: DiscoveryInput;
  data: DiscoveryOptions;
  onSelect: (value: string) => void;
  onClose: () => void;
}) {
  if (!open) {
    return null;
  }
  const spec = filterSpec(open, input, data);
  if (isFacetFilter(open)) {
    return (
      <DiscoverFacetSheet
        key={open}
        kind={facetFilters[open].kind}
        title={spec.title}
        selected={spec.selected.map(Number)}
        onSelect={onSelect}
        onClose={onClose}
      />
    );
  }
  return <ChoiceSheet {...spec} onSelect={onSelect} onClose={onClose} />;
}

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
  function select(value: string) {
    if (!open) {
      return;
    }
    const current = filterSpec(open, input, data);
    if (!current.multiple) {
      change({ [open]: value, page: '1' });
      setOpen(null);
      return;
    }
    const values = toggleSelection(current.selected, value, current.maxSelections);
    change({ [open]: values.join('|'), page: '1' });
  }
  const count = activeDiscoverFilterCount(input);
  const label = count > 0 ? `Filters (${count})` : 'Filters';
  const choices = filters
    .filter((filter) => filter !== 'networkId' || input.type === 'tv')
    .map((filter) => {
      const spec = filterSpec(filter, input, data);
      return { filter, title: spec.title, summary: selectionSummary(spec) };
    });

  function clear() {
    change({
      genreId: '',
      keywordId: '',
      companyId: '',
      networkId: '',
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
      <DiscoverFilterSheet
        open={open}
        input={input}
        data={data}
        onSelect={select}
        onClose={() => setOpen(null)}
      />
    </View>
  );
}
