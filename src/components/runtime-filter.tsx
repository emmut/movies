'use client';

import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRuntimeFilter } from '@/hooks/use-runtime-filter';
import { cn } from '@/lib/utils';

const RUNTIME_OPTIONS = [
  { value: '0', label: 'Any' },
  { value: '30', label: 'Up to 30 min' },
  { value: '60', label: 'Up to 60 min' },
  { value: '90', label: 'Up to 90 min' },
  { value: '120', label: 'Up to 120 min' },
];

type RuntimeFilterProps = {
  className?: string;
};

/**
 * Runtime filter component for discover page.
 *
 * Allows users to filter movies and TV shows by maximum runtime (less than or equal to).
 * Uses nuqs to manage URL state with a clean 'runtime' URL parameter.
 */
export default function RuntimeFilter({ className }: RuntimeFilterProps) {
  const [{ runtimeLte }, setRuntimeFilter] = useRuntimeFilter();

  return (
    <div className={cn('flex min-w-32 flex-col gap-2', className)}>
      <Label htmlFor="runtime-filter">Runtime</Label>
      <Select
        value={runtimeLte?.toString() ?? '0'}
        onValueChange={(value) =>
          setRuntimeFilter({
            runtimeLte: value && value !== '0' ? Number(value) : null,
          })
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
