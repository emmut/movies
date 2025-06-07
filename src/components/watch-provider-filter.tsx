'use client';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Check, Filter } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

const COMMON_PROVIDERS = [
  {
    provider_id: 8,
    provider_name: 'Netflix',
    logo_path: '/9A1JSVmSxsyaBK4SUFsYVqbAYfW.jpg',
  },
  {
    provider_id: 119,
    provider_name: 'Amazon Prime Video',
    logo_path: '/emthp39XA2YScoYL1p0sdbAH2WA.jpg',
  },
  {
    provider_id: 337,
    provider_name: 'Disney Plus',
    logo_path: '/dgPueyEdOwpQ10fjuhL2WYFQwQs.jpg',
  },
  {
    provider_id: 384,
    provider_name: 'HBO Max',
    logo_path: '/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg',
  },
  {
    provider_id: 15,
    provider_name: 'Hulu',
    logo_path: '/zxrVdFjIjLqkfnwyghnfywTn3Ll.jpg',
  },
  {
    provider_id: 350,
    provider_name: 'Apple TV Plus',
    logo_path: '/6uhKBfmtzFqOcLousHwZuzcrScK.jpg',
  },
  {
    provider_id: 283,
    provider_name: 'Crunchyroll',
    logo_path: '/sNzNd6unLvh5sKe6a1ZNcyA4Sv9.jpg',
  },
  {
    provider_id: 1899,
    provider_name: 'Max',
    logo_path: '/cjqJZyXfxBq0aGu4H5o6vhHcW5Q.jpg',
  },
];

/**
 * Renders a popover filter for selecting streaming service providers.
 *
 * Allows users to filter content by multiple watch providers using a popover interface.
 * Uses OR logic - shows content available on ANY of the selected providers.
 * The selected providers are applied to URL query parameters for filtering results.
 */
export default function WatchProviderFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [selectedProviders, setSelectedProviders] = useState<number[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const providers = searchParams.get('with_watch_providers');
    if (providers) {
      // Handle both comma (AND) and pipe (OR) separators
      const separator = providers.includes('|') ? '|' : ',';
      setSelectedProviders(
        providers.split(separator).map((id) => parseInt(id))
      );
    } else {
      setSelectedProviders([]);
    }
  }, [searchParams]);

  function updateSelectedProviders(providerId: number) {
    const newProviders = selectedProviders.includes(providerId)
      ? selectedProviders.filter((id) => id !== providerId)
      : [...selectedProviders, providerId];

    setSelectedProviders(newProviders);
    updateUrl(newProviders);
  }

  function updateUrl(providers: number[]) {
    const newSearchParams = new URLSearchParams(searchParams.toString());

    if (providers.length > 0) {
      newSearchParams.set('with_watch_providers', providers.join('|'));
      newSearchParams.set('watch_region', 'SE');
    } else {
      newSearchParams.delete('with_watch_providers');
      newSearchParams.delete('watch_region');
    }

    // Reset to first page when filters change
    newSearchParams.set('page', '1');

    router.push(`${pathname}?${newSearchParams.toString()}`);
  }

  function clearAllProviders() {
    setSelectedProviders([]);
    updateUrl([]);
  }

  const selectedCount = selectedProviders.length;

  return (
    <div className="space-y-2">
      <Label htmlFor="watch-providers">Watch Providers</Label>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start"
            id="watch-providers"
          >
            <Filter className="mr-2 h-4 w-4" />
            {selectedCount > 0
              ? `${selectedCount} provider${selectedCount === 1 ? '' : 's'} selected`
              : 'Select watch providers'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
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
              {COMMON_PROVIDERS.map((provider) => {
                const isSelected = selectedProviders.includes(
                  provider.provider_id
                );

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
                    <div className="flex-shrink-0">
                      <img
                        src={`https://image.tmdb.org/t/p/original${provider.logo_path}`}
                        alt={provider.provider_name}
                        className="h-8 w-8 rounded-md object-cover"
                      />
                    </div>
                    <div className="flex-1 text-sm font-medium">
                      {provider.provider_name}
                    </div>
                    {isSelected && <Check className="text-primary h-4 w-4" />}
                  </div>
                );
              })}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
