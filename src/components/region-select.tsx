'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DEFAULT_REGION, regions, type RegionCode } from '@/lib/regions';
import { parseAsStringLiteral, useQueryState } from 'nuqs';

const regionCodes = regions.map((r) => r.code);

type RegionSelectProps = {
  defaultValue?: RegionCode;
};

export function RegionSelect({ defaultValue }: RegionSelectProps) {
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
      <SelectTrigger className="w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {regions.map((regionOption) => (
          <SelectItem key={regionOption.code} value={regionOption.code}>
            {regionOption.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
