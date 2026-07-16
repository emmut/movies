'use client';

import { Check, Filter } from 'lucide-react';
import Image from 'next/image';
import { parseAsArrayOf, parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { ComponentProps, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover';
import { DEFAULT_REGION } from '@/lib/regions';
import { cn } from '@/lib/utils';
import { WatchProvider } from '@/types/watch-provider';

interface WatchProviderFilterProps {
  providers: WatchProvider[];
  userRegion: string;
  /**
   * Renders a small labelless trigger that sits inline with `size="sm"`
   * header buttons (list pages) instead of the labeled panel field (discover).
   */
  compact?: boolean;
}

// Both triggers spread rest props (and ref) into Button: PopoverTrigger's
// `render` clones the element with the trigger props (onClick, aria-*), and
// dropping them leaves a button that never opens the popover.
type TriggerProps = { selectedCount: number } & ComponentProps<typeof Button>;

/** Discover's filter-panel trigger: labeled, full-width field. */
function PanelTrigger({ selectedCount, className, ...props }: TriggerProps) {
  return (
    <Button
      {...props}
      variant="outline"
      className={cn('w-full justify-between', className)}
      id="watch-providers"
    >
      <Filter className="mr-2 h-4 w-4" />
      {selectedCount > 0
        ? `${selectedCount} provider${selectedCount === 1 ? '' : 's'} selected`
        : 'Select watch providers'}
    </Button>
  );
}

/** List-header trigger: compact button with a count badge when active. */
function CompactTrigger({ selectedCount, ...props }: TriggerProps) {
  return (
    <Button {...props} variant="outline" size="sm">
      <Filter className="h-4 w-4" />
      Providers
      {selectedCount > 0 && (
        <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
          {selectedCount}
        </span>
      )}
    </Button>
  );
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
  compact = false,
}: WatchProviderFilterProps) {
  const [{ with_watch_providers }, setParams] = useQueryStates({
    with_watch_providers: parseAsArrayOf(parseAsInteger).withDefault([]),
    watch_region: parseAsString.withDefault(DEFAULT_REGION),
    page: parseAsString.withDefault('1'),
  });

  const selectedProviders = with_watch_providers || [];

  const [isOpen, setIsOpen] = useState(false);
  const [brokenImages, setBrokenImages] = useState(new Set<number>());

  function updateSelectedProviders(providerId: number) {
    const newProviders = selectedProviders.includes(providerId)
      ? selectedProviders.filter((id) => id !== providerId)
      : [...selectedProviders, providerId];

    updateUrl(newProviders);
  }

  function updateUrl(providerIds: number[]) {
    setParams(
      {
        with_watch_providers: providerIds.length > 0 ? providerIds : null,
        watch_region: providerIds.length > 0 ? userRegion : null,
        page: '1',
      },
      {
        shallow: false,
      },
    );
  }

  function clearAllProviders() {
    updateUrl([]);
  }

  function handleImageError(providerId: number) {
    setBrokenImages((prev) => new Set([...prev, providerId]));
  }

  const selectedCount = selectedProviders.length;

  const popover = (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger
        render={
          compact ? (
            <CompactTrigger selectedCount={selectedCount} />
          ) : (
            <PanelTrigger selectedCount={selectedCount} />
          )
        }
      />
        <PopoverContent
          align={compact ? 'start' : 'end'}
          side="bottom"
          sideOffset={10}
          className="max-h-[60dvh] overflow-auto"
        >
          <PopoverHeader>
            <div className="flex items-baseline justify-between">
              <PopoverTitle className="py-1">Watch Providers</PopoverTitle>
              {selectedCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearAllProviders} className="text-xs">
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
                    onClick={() => updateSelectedProviders(provider.provider_id)}
                  >
                    <div className="shrink-0">
                      {imageError ? (
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-sm font-semibold">
                          {provider.provider_name.charAt(0).toUpperCase()}
                        </div>
                      ) : (
                        <Image
                          unoptimized
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
  );

  if (compact) {
    return popover;
  }

  return (
    <div className="min-w-54">
      <Label htmlFor="watch-providers" className="mb-2 flex justify-end @3xl:self-end">
        Watch Providers
      </Label>
      {popover}
    </div>
  );
}
