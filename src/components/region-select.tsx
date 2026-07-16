'use client';

import { parseAsStringLiteral, useQueryState } from 'nuqs';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DEFAULT_REGION, Region, regions, type RegionCode } from '@/lib/regions';
import { RegionWatchProviders } from '@/types/watch-provider';

import { Dot } from './ui/dot';

const regionCodes = regions.map((r) => r.code);

/** Whether a region has any streaming, rental, or purchase options. */
function hasProviders(providers: RegionWatchProviders | undefined): boolean {
  if (!providers) {
    return false;
  }
  return [providers.flatrate, providers.rent, providers.buy].some(
    (services) => (services?.length ?? 0) > 0,
  );
}

type RegionSelectProps = {
  defaultValue: RegionCode;
  allRegionProviders: Partial<Record<RegionCode, RegionWatchProviders>>;
};

function RegionSelectItem({
  regionOption,
  allRegionProviders,
}: {
  regionOption: Region;
  allRegionProviders: Partial<Record<RegionCode, RegionWatchProviders>>;
}) {
  const { name, code } = regionOption;
  const currentRegionHasServices = hasProviders(allRegionProviders[code]);

  return (
    <SelectItem key={code} value={code} className="group">
      {currentRegionHasServices && (
        <>
          <Dot
            size={2}
            className="hidden group-focus-within:flex group-hover:flex"
            animated={true}
          />
          <Dot size={2} className="group-focus-within:hidden group-hover:hidden" />
        </>
      )}

      <span className="whitespace-nowrap">{name}</span>
    </SelectItem>
  );
}

export function RegionSelect({ defaultValue, allRegionProviders }: RegionSelectProps) {
  const [region, setRegion] = useQueryState(
    'region',
    parseAsStringLiteral(regionCodes).withDefault(defaultValue ?? DEFAULT_REGION),
  );

  function handleValueChange(value: string | null) {
    if (value) setRegion(value as RegionCode);
  }

  return (
    <Select value={region} onValueChange={handleValueChange}>
      <SelectTrigger className="w-44">
        <SelectValue>{regions.find((r) => r.code === region)?.name}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {regions.map((regionOption) => (
          <RegionSelectItem
            key={regionOption.code}
            regionOption={regionOption}
            allRegionProviders={allRegionProviders}
          />
        ))}
      </SelectContent>
    </Select>
  );
}
