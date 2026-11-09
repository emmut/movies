'use client';

import { useQuery } from '@tanstack/react-query';
import { Building2, Tv } from 'lucide-react';
import { parseAsArrayOf, parseAsInteger, useQueryStates } from 'nuqs';
import { useId } from 'react';

import { NamedFilterSearch } from '@/components/named-filter-search';
import { SelectedFilterChips } from '@/components/selected-filter-chips';
import { getCompanies, searchCompanies } from '@/lib/company-search';
import { getNetworks, searchNetworks } from '@/lib/network-search';
import { queryKeys } from '@/lib/query-keys';

export const organizationFilters = {
  company: {
    urlKey: 'companyId',
    title: 'Production companies',
    label: 'Companies',
    singular: 'Company',
    noun: 'company',
    plural: 'production companies',
    icon: Building2,
    search: searchCompanies,
    get: getCompanies,
    queryKey: queryKeys.search.companies,
  },
  network: {
    urlKey: 'networkId',
    title: 'Networks',
    label: 'Networks',
    singular: 'Network',
    noun: 'network',
    plural: 'networks',
    icon: Tv,
    search: searchNetworks,
    get: getNetworks,
    queryKey: queryKeys.search.networks,
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
  const { data } = useQuery({
    queryKey: [config.urlKey, ids],
    queryFn: () => config.get(ids),
    enabled: ids.length > 0,
    staleTime: 60 * 1000,
  });
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
    <section className="min-w-0 space-y-3" aria-labelledby={headingId}>
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
        search={config.search}
        queryKey={config.queryKey}
        label={config.plural}
        icon={config.icon}
      />
      {chips}
      <p className="text-xs text-muted-foreground">Titles from any selected {config.noun}.</p>
    </section>
  );
}
