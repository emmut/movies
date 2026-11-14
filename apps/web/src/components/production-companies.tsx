import type { ProductionCompany } from '@movies/api/tmdb-types/pdp';

import { OrganizationLinks } from '@/components/organization-links';

export function ProductionCompanies({
  companies,
  type,
}: {
  companies: ProductionCompany[];
  type: 'movie' | 'tv';
}) {
  return <OrganizationLinks items={companies} type={type} kind="company" />;
}
