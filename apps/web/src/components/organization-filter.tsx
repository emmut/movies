'use client';

import { useDiscoveryFacets } from '@movies/api/react/use-discovery-query';
import { Building2, Tv } from 'lucide-react';
import { parseAsArrayOf, parseAsInteger, useQueryStates } from 'nuqs';
import { useId } from 'react';

import { NamedFilterSearch } from '@/components/named-filter-search';
import { SelectedFilterChips } from '@/components/selected-filter-chips';

const organizationFilters = {
  company: {
    urlKey: 'companyId',
    title: 'Production companies',
    singular: 'Company',
    noun: 'company',
    plural: 'production companies',
    icon: Building2,
  },
  network: {
    urlKey: 'networkId',
    title: 'Networks',
    singular: 'Network',
    noun: 'network',
    plural: 'networks',
    icon: Tv,
  },
};

export function OrganizationFilter({
  kind,
  chipsOnly = false,
}: {
  kind: 'company' | 'network';
  chipsOnly?: boolean;
}) {
  const config = organizationFilters[kind];
  const headingId = useId();
  const [{ ids }, setState] = useQueryStates(
    {
      ids: parseAsArrayOf(parseAsInteger).withDefault([]),
      page: parseAsInteger.withDefault(1),
    },
    { urlKeys: { ids: config.urlKey }, history: 'push' },
  );
  const { data } = useDiscoveryFacets({ kind, ids, query: '' }, ids.length > 0);
  const items = ids.map((id) => ({
    id,
    name: data?.find((company) => company.id === id)?.name ?? `${config.singular} ${id}`,
  }));

  const chips = (
    <SelectedFilterChips
      items={items}
      kind={kind}
      onRemove={(id) => void setState({ ids: ids.filter((value) => value !== id), page: 1 })}
    />
  );
  if (chipsOnly) {
    return chips;
  }

  return (
    <section className="w-full min-w-0 space-y-3" aria-labelledby={headingId}>
      <h3 id={headingId} className="text-sm font-medium text-muted-foreground">
        {config.title}
      </h3>
      <NamedFilterSearch
        selectedIds={ids}
        onSelect={(id) => {
          if (!ids.includes(id)) {
            void setState({ ids: [...ids, id], page: 1 });
          }
        }}
        kind={kind}
        label={config.plural}
        icon={config.icon}
      />
      {chips}
      <p className="text-xs text-muted-foreground">Titles from any selected {config.noun}.</p>
    </section>
  );
}
