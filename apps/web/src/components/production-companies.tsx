import type { ProductionCompany } from '@/types/pdp';

export function ProductionCompanies({ companies }: { companies: ProductionCompany[] }) {
  if (companies.length === 0) {
    return null;
  }

  return (
    <div className="min-w-0">
      <h3 className="mb-1 text-sm font-semibold text-zinc-400 uppercase">Production Companies</h3>
      <p className="text-sm leading-relaxed wrap-anywhere text-zinc-300">
        {companies.map((company) => company.name).join(', ')}
      </p>
    </div>
  );
}
