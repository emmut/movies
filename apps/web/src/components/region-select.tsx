import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@movies/ui/components/select';
import { Region, regions, type RegionCode } from '@movies/media';
import { RegionWatchProviders } from '@movies/api/types/watch-provider';

import { Dot } from '@movies/ui/components/dot';

type RegionSelectProps = {
  allRegionProviders: Record<RegionCode, RegionWatchProviders>;
  value: RegionCode;
  onChange: (region: RegionCode) => void;
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
    streamingServices.length > 0 || rentalServices.length > 0 || purchaseServices.length > 0;

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

export function RegionSelect({ allRegionProviders, value, onChange }: Omit<RegionSelectProps, 'defaultValue'>) {
  return (
    <Select value={value} onValueChange={(v) => v && onChange(v as RegionCode)}>
      <SelectTrigger className="w-44">
        <SelectValue>{regions.find((r) => r.code === value)?.name}</SelectValue>
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
