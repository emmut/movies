import { OrganizationLinks } from '@/components/organization-links';
import type { ProductionCompany } from '@/types/pdp';

export function ProductionCompanies({
  companies,
  type,
}: {
  companies: ProductionCompany[];
  type: 'movie' | 'tv';
}) {
  return <OrganizationLinks items={companies} type={type} kind="company" />;
}
