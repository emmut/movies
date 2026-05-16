import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { Button } from '@movies/ui/components/button';
import { Label } from '@movies/ui/components/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@movies/ui/components/select';
import type { Region } from '@movies/media';
import { orpc } from '@/utils/orpc';

interface RegionFormProps {
  currentRegion: string;
  regions: readonly Region[];
}

export function RegionForm({ currentRegion, regions }: RegionFormProps) {
  const [selectedRegion, setSelectedRegion] = useState(currentRegion);
  const [, startTransition] = useTransition();
  const queryClient = useQueryClient();

  const updateRegion = useMutation(
    orpc.user.updateRegion.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: orpc.user.region.key() });
        toast('Region settings saved!');
      },
      onError: () => {
        toast.error('Could not save region settings');
      },
    }),
  );

  function handleSubmit() {
    if (selectedRegion === currentRegion) return;
    startTransition(() => {
      updateRegion.mutate({ region: selectedRegion });
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="region-select">Region</Label>
        <Select
          value={selectedRegion}
          onValueChange={(value) => value && setSelectedRegion(value)}
          disabled={updateRegion.isPending}
        >
          <SelectTrigger id="region-select">
            <SelectValue>
              {regions.find((r) => r.code === selectedRegion)?.name}
            </SelectValue>
          </SelectTrigger>
          <SelectContent side="bottom" align="start" sideOffset={2} className="max-h-60">
            {regions.map((region) => (
              <SelectItem key={region.code} value={region.code}>
                {region.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={updateRegion.isPending || selectedRegion === currentRegion}
      >
        {updateRegion.isPending ? 'Saving...' : 'Save changes'}
      </Button>
    </div>
  );
}
