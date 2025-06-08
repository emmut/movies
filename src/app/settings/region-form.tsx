'use client';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Region } from '@/lib/regions';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

interface RegionFormProps {
  currentRegion: string;
  regions: readonly Region[];
  updateRegionAction: (
    region: string
  ) => Promise<{ success: boolean; region: string }>;
}

export function RegionForm({
  currentRegion,
  regions,
  updateRegionAction,
}: RegionFormProps) {
  const [selectedRegion, setSelectedRegion] = useState(currentRegion);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit() {
    if (selectedRegion === currentRegion) {
      return;
    }

    startTransition(async () => {
      try {
        await updateRegionAction(selectedRegion);
        toast('Region settings saved!');
      } catch (error) {
        console.error('Error updating region:', error);
        toast.error('Could not save region settings');
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="region-select">Region</Label>
        <Select
          value={selectedRegion}
          onValueChange={setSelectedRegion}
          disabled={isPending}
        >
          <SelectTrigger id="region-select">
            <SelectValue placeholder="Select region" />
          </SelectTrigger>
          <SelectContent
            collisionPadding={10}
            side="bottom"
            align="start"
            sideOffset={2}
            avoidCollisions={true}
            className="max-h-[15rem]"
          >
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
        disabled={isPending || selectedRegion === currentRegion}
      >
        {isPending ? 'Saving...' : 'Save changes'}
      </Button>
    </div>
  );
}
