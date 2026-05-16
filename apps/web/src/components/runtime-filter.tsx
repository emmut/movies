import { Label } from '@movies/ui/components/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@movies/ui/components/select';

const RUNTIME_OPTIONS = [
  { value: '0', label: 'Any' },
  { value: '30', label: 'Up to 30 min' },
  { value: '60', label: 'Up to 60 min' },
  { value: '90', label: 'Up to 90 min' },
  { value: '120', label: 'Up to 120 min' },
];

type RuntimeFilterProps = {
  value: number | null;
  onChange: (value: number | null) => void;
  className?: string;
};

export default function RuntimeFilter({ value, onChange, className }: RuntimeFilterProps) {
  return (
    <div className={className}>
      <Label htmlFor="runtime-filter" className="mb-2">
        Runtime
      </Label>
      <Select
        value={value?.toString() ?? '0'}
        onValueChange={(v) => onChange(v && v !== '0' ? Number(v) : null)}
      >
        <SelectTrigger id="runtime-filter" className="w-full min-w-54">
          <SelectValue>
            {RUNTIME_OPTIONS.find((o) => o.value === (value?.toString() ?? '0'))?.label}
          </SelectValue>
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
