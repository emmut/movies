import { parseAsArrayOf, parseAsInteger, useQueryState } from 'nuqs';

import { DiscoverFilterPopover } from '@/components/discover-filter-popover';
import { OrganizationFilter, organizationFilters } from '@/components/organization-filter';

export function DiscoverOrganizationFilter({ kind }: { kind: 'company' | 'network' }) {
  const config = organizationFilters[kind];
  const [selectedIds] = useQueryState(
    config.urlKey,
    parseAsArrayOf(parseAsInteger).withDefault([]),
  );
  return (
    <DiscoverFilterPopover
      count={selectedIds.length}
      label={config.label}
      title={config.title}
      description={`Find titles from any selected ${config.noun}.`}
      icon={config.icon}
    >
      <OrganizationFilter kind={kind} />
    </DiscoverFilterPopover>
  );
}
