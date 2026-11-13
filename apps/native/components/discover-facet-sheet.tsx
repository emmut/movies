import type { DiscoveryFacetInput } from '@movies/api/discover';
import { ChoiceSheet } from '@native/components/choice-sheet';
import { orpc } from '@native/lib/api';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

export function DiscoverFacetSheet({
  kind,
  title,
  selected,
  onSelect,
  onClose,
}: {
  kind: DiscoveryFacetInput['kind'];
  title: string;
  selected: number[];
  onSelect: (value: string) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setQuery(search.trim()), 250);
    return () => clearTimeout(timer);
  }, [search]);
  const results = useQuery(
    orpc.discovery.facets.queryOptions({
      input: { kind, query, ids: selected },
      retry: false,
    }),
  );
  const options = results.data ?? selected.map((id) => ({ id, name: `${kind} ${id}` }));
  return (
    <ChoiceSheet
      title={title}
      options={options.map((item) => ({ value: String(item.id), label: item.name }))}
      selected={selected.map(String)}
      multiple
      maxSelections={50}
      onSearch={setSearch}
      onSelect={onSelect}
      onClose={onClose}
      pending={results.isPending || search.trim() !== query}
      failed={results.isError}
      retry={() => {
        void results.refetch();
      }}
      emptyLabel={
        query.length < 2 ? 'Type at least 2 characters to search.' : 'No matching options.'
      }
    />
  );
}
