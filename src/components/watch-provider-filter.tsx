'use client';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { WatchProvider } from '@/types/watch-provider';
import { Check, Filter } from 'lucide-react';
import Image from 'next/image';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

interface WatchProviderFilterProps {
  providers: WatchProvider[];
  userRegion: string;
}

/**
 * Renders a popover filter for selecting streaming service providers.
 *
 * Allows users to filter content by multiple watch providers using a popover interface.
 * Uses OR logic - shows content available on ANY of the selected providers.
 * The selected providers are applied to URL query parameters for filtering results.
 */
export default function WatchProviderFilter({
  providers,
  userRegion,
}: WatchProviderFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Derive selected providers directly from URL params
  const providersParam = searchParams.get('with_watch_providers');
  const selectedProviders = providersParam
    ? providersParam
        .split(providersParam.includes('|') ? '|' : ',')
        .map((id) => parseInt(id))
    : [];

  const [isOpen, setIsOpen] = useState(false);
  const [brokenImages, setBrokenImages] = useState(new Set<number>());

  function updateSelectedProviders(providerId: number) {
    const newProviders = selectedProviders.includes(providerId)
      ? selectedProviders.filter((id) => id !== providerId)
      : [...selectedProviders, providerId];

    updateUrl(newProviders);
  }

  function updateUrl(providerIds: number[]) {
    const newSearchParams = new URLSearchParams(searchParams.toString());

    if (providerIds.length > 0) {
      newSearchParams.set('with_watch_providers', providerIds.join('|'));
      newSearchParams.set('watch_region', userRegion);
    } else {
      newSearchParams.delete('with_watch_providers');
      newSearchParams.delete('watch_region');
    }

    newSearchParams.set('page', '1');

    router.push(`${pathname}?${newSearchParams.toString()}`);
  }

  function clearAllProviders() {
    updateUrl([]);
  }

  function handleImageError(providerId: number) {
    setBrokenImages((prev) => new Set([...prev, providerId]));
  }

  const selectedCount = selectedProviders.length;

  return (
    <div className="flex min-w-54 flex-col gap-2">
      <Label htmlFor="watch-providers" className="sm:self-end">
        Watch Providers
      </Label>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between"
            id="watch-providers"
          >
            <Filter className="mr-2 h-4 w-4" />
            {selectedCount > 0
              ? `${selectedCount} provider${selectedCount === 1 ? '' : 's'} selected`
              : 'Select watch providers'}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="max-h-(--radix-popover-content-available-height) w-80 overflow-y-auto p-4"
          align="end"
          side="bottom"
          avoidCollisions={true}
          collisionPadding={10}
          sideOffset={4}
        >
          <div className="space-y-4">
            <div className="flex min-h-8 items-center justify-between">
              <h4 className="font-medium">Watch Providers</h4>
              {selectedCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllProviders}
                  className="h-8 px-2 text-xs"
                >
                  Clear all
                </Button>
              )}
            </div>

            <div className="grid gap-2">
              {providers.length === 0 ? (
                <div className="text-muted-foreground flex items-center justify-center p-4 text-sm">
                  No providers available
                </div>
              ) : (
                providers.map((provider) => {
                  const isSelected = selectedProviders.includes(
                    provider.provider_id
                  );
                  const imageError = brokenImages.has(provider.provider_id);

                  return (
                    <div
                      key={provider.provider_id}
                      className={`hover:bg-accent flex cursor-pointer items-center space-x-3 rounded-md p-2 transition-colors ${
                        isSelected ? 'bg-accent' : ''
                      }`}
                      onClick={() =>
                        updateSelectedProviders(provider.provider_id)
                      }
                    >
                      <div className="shrink-0">
                        {imageError ? (
                          <div className="bg-muted flex h-8 w-8 items-center justify-center rounded-md text-sm font-semibold">
                            {provider.provider_name.charAt(0).toUpperCase()}
                          </div>
                        ) : (
                          <Image
                            width={32}
                            height={32}
                            src={`https://image.tmdb.org/t/p/original${provider.logo_path}`}
                            alt={provider.provider_name}
                            className="h-8 w-8 rounded-md object-cover"
                            onError={() =>
                              handleImageError(provider.provider_id)
                            }
                          />
                        )}
                      </div>
                      <div className="flex-1 text-sm font-medium">
                        {provider.provider_name}
                      </div>
                      {isSelected && <Check className="text-primary h-4 w-4" />}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
