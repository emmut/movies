'use client';

import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { parseAsInteger, useQueryStates } from 'nuqs';

const RUNTIME_OPTIONS = [
  { value: '0', label: 'Any' },
  { value: '25', label: '25+ min' },
  { value: '40', label: '40+ min' },
  { value: '60', label: '60+ min' },
];

/**
 * Runtime filter component for discover page.
 *
 * Allows users to filter movies and TV shows by minimum runtime.
 * Uses nuqs to manage URL state for the with_runtime_gte parameter.
 */
export default function RuntimeFilter() {
  const [runtimeGte, setRuntimeGte] = useQueryStates({
    with_runtime_gte: parseAsInteger,
    with_runtime_lte: parseAsInteger,
  });

  return (
    <div className="flex min-w-32 flex-col gap-2">
      <Label htmlFor="runtime-filter">Runtime</Label>
      <Select
        value={runtimeGte?.toString() ?? '0'}
        onValueChange={(value) =>
          setRuntimeGte(value && value !== '0' ? Number(value) : null)
        }
      >
        <SelectTrigger id="runtime-filter">
          <SelectValue placeholder="Any runtime" />
        </SelectTrigger>
        <SelectContent>
          {RUNTIME_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
