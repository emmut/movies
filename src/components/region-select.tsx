'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DEFAULT_REGION,
  Region,
  regions,
  type RegionCode,
} from '@/lib/regions';
import { RegionWatchProviders } from '@/types/movie';
import { parseAsStringLiteral, useQueryState } from 'nuqs';
import { Dot } from './ui/dot';

const regionCodes = regions.map((r) => r.code);

type RegionSelectProps = {
  defaultValue: RegionCode;
  allRegionProviders: Record<RegionCode, RegionWatchProviders>;
};

function RegionSelectItem({
  regionOption,
  allRegionProviders,
}: {
  regionOption: Region;
  allRegionProviders: Record<RegionCode, RegionWatchProviders>;
}) {
  const { name, code } = regionOption;
  const currentRegionProviders = allRegionProviders[code];
  const streamingServices = currentRegionProviders?.flatrate ?? [];
  const rentalServices = currentRegionProviders?.rent ?? [];
  const purchaseServices = currentRegionProviders?.buy ?? [];

  const currentRegionHasServices =
    streamingServices.length > 0 ||
    rentalServices.length > 0 ||
    purchaseServices.length > 0;

  return (
    <SelectItem key={code} value={code} className="group">
      {currentRegionHasServices && (
        <>
          <Dot
            size={2}
            className="hidden group-focus-within:flex group-hover:flex"
            animated={true}
          />
          <Dot
            size={2}
            className="group-focus-within:hidden group-hover:hidden"
          />
        </>
      )}

      <span className="whitespace-nowrap">{name}</span>
    </SelectItem>
  );
}

export function RegionSelect({
  defaultValue,
  allRegionProviders,
}: RegionSelectProps) {
  const [region, setRegion] = useQueryState(
    'region',
    parseAsStringLiteral(regionCodes).withDefault(
      defaultValue ?? DEFAULT_REGION
    )
  );

  function handleValueChange(value: string) {
    setRegion(value as RegionCode);
  }

  return (
    <Select value={region} onValueChange={handleValueChange}>
      <SelectTrigger className="w-44">
        <SelectValue />
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
