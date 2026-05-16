import { Check, Filter } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@movies/ui/components/button';
import { Label } from '@movies/ui/components/label';
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@movies/ui/components/popover';
import { WatchProvider } from '@movies/api/types/watch-provider';

interface WatchProviderFilterProps {
  providers: WatchProvider[];
  selectedProviders: number[];
  userRegion: string;
  onChange: (providerIds: number[]) => void;
}

export default function WatchProviderFilter({
  providers,
  selectedProviders,
  onChange,
}: WatchProviderFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [brokenImages, setBrokenImages] = useState(new Set<number>());

  function toggleProvider(providerId: number) {
    const next = selectedProviders.includes(providerId)
      ? selectedProviders.filter((id) => id !== providerId)
      : [...selectedProviders, providerId];
    onChange(next);
  }

  function handleImageError(providerId: number) {
    setBrokenImages((prev) => new Set([...prev, providerId]));
  }

  const selectedCount = selectedProviders.length;

  return (
    <div className="min-w-54">
      <Label htmlFor="watch-providers" className="mb-2 flex justify-end sm:self-end">
        Watch Providers
      </Label>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger
          render={
            <Button variant="outline" className="w-full justify-between" id="watch-providers" />
          }
        >
          <Filter className="mr-2 h-4 w-4" />
          {selectedCount > 0
            ? `${selectedCount} provider${selectedCount === 1 ? '' : 's'} selected`
            : 'Select watch providers'}
        </PopoverTrigger>
        <PopoverContent
          align="end"
          side="bottom"
          sideOffset={10}
          className="max-h-[60dvh] overflow-auto"
        >
          <PopoverHeader>
            <div className="flex items-baseline justify-between">
              <PopoverTitle className="py-1">Watch Providers</PopoverTitle>
              {selectedCount > 0 && (
                <Button variant="ghost" size="sm" onClick={() => onChange([])} className="text-xs">
                  Clear all
                </Button>
              )}
            </div>
          </PopoverHeader>

          <div className="grid gap-2">
            {providers.length === 0 ? (
              <div className="flex items-center justify-center p-4 text-sm text-muted-foreground">
                No providers available
              </div>
            ) : (
              providers.map((provider) => {
                const isSelected = selectedProviders.includes(provider.provider_id);
                const imageError = brokenImages.has(provider.provider_id);

                return (
                  <button
                    type="button"
                    key={provider.provider_id}
                    className={`flex cursor-pointer items-center space-x-3 rounded-md p-2 transition-colors hover:bg-accent ${
                      isSelected ? 'bg-accent' : ''
                    }`}
                    onClick={() => toggleProvider(provider.provider_id)}
                  >
                    <div className="shrink-0">
                      {imageError ? (
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-sm font-semibold">
                          {provider.provider_name.charAt(0).toUpperCase()}
                        </div>
                      ) : (
                        <img
                          width={32}
                          height={32}
                          src={`https://image.tmdb.org/t/p/original${provider.logo_path}`}
                          alt={provider.provider_name}
                          className="h-8 w-8 rounded-md object-cover"
                          onError={() => handleImageError(provider.provider_id)}
                        />
                      )}
                    </div>
                    <div className="flex-1 text-left text-sm font-medium">
                      {provider.provider_name}
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-primary" />}
                  </button>
                );
              })
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
