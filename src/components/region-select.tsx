'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { parseAsStringLiteral, useQueryState } from 'nuqs';

// Common regions for streaming services
const regions = [
  { code: 'SE', name: 'Sweden' },
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'NO', name: 'Norway' },
  { code: 'DK', name: 'Denmark' },
  { code: 'FI', name: 'Finland' },
] as const;

type RegionCode = (typeof regions)[number]['code'];

const regionCodes = regions.map((r) => r.code);

export function RegionSelect() {
  const [region, setRegion] = useQueryState(
    'region',
    parseAsStringLiteral(regionCodes).withDefault('SE')
  );

  const handleValueChange = (value: string) => {
    setRegion(value as RegionCode);
  };

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
