'use client';

import { Button } from '@movies/ui/components/button';
import { Label } from '@movies/ui/components/label';
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@movies/ui/components/popover';
import { cn } from 'cn';
import { Check, Filter } from 'lucide-react';
import Image from 'next/image';
import { ComponentProps, useState } from 'react';

import { FilterCount } from '@/components/filter-count';
import { useWatchProviderSelection } from '@/hooks/use-watch-provider-selection';
import { formatImageUrl } from '@/lib/utils';
import { WatchProvider } from '@/types/watch-provider';

interface WatchProviderFilterProps {
  providers: WatchProvider[];
  userRegion: string;
  controlId?: string;
  /**
   * Renders a labelless toolbar trigger for list pages instead of a labeled field.
   */
  compact?: boolean;
}

// Both triggers spread rest props (and ref) into Button: PopoverTrigger's
// `render` clones the element with the trigger props (onClick, aria-*), and
// dropping them leaves a button that never opens the popover.
type TriggerProps = { selectedCount: number; controlId?: string } & ComponentProps<typeof Button>;

/** Discover's filter-panel trigger: labeled, full-width field. */
function PanelTrigger({ selectedCount, controlId, className, ...props }: TriggerProps) {
  return (
    <Button
      {...props}
      variant="outline"
      className={cn('w-full justify-between', className)}
      id={controlId}
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
    <Button
      {...props}
      variant="outline"
      aria-label={selectedCount > 0 ? `Providers (${selectedCount})` : 'Providers'}
      className={cn(
        'relative h-10 gap-2 px-4',
        selectedCount > 0 && 'border-primary/40 bg-primary/5',
      )}
    >
      <Filter className="size-4" aria-hidden="true" />
      Providers
      <FilterCount count={selectedCount} />
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
  controlId = 'watch-providers',
  compact = false,
}: WatchProviderFilterProps) {
  const { selectedProviders, toggleProvider, clearProviders } =
    useWatchProviderSelection(userRegion);
  const [isOpen, setIsOpen] = useState(false);
  const [brokenImages, setBrokenImages] = useState(new Set<number>());

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
            <PanelTrigger selectedCount={selectedCount} controlId={controlId} />
          )
        }
      />
      <PopoverContent
        align={compact ? 'start' : 'end'}
        side="bottom"
        sideOffset={10}
        className="max-h-(--available-height) w-80 max-w-(--available-width) gap-4 overflow-auto p-4"
      >
        <PopoverHeader>
          <div className="flex items-baseline justify-between">
            <PopoverTitle className="py-1">Watch Providers</PopoverTitle>
            {selectedCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearProviders} className="text-xs">
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
                  aria-label={provider.provider_name}
                  aria-pressed={isSelected}
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
                      <Image
                        unoptimized
                        width={32}
                        height={32}
                        src={formatImageUrl(provider.logo_path, 92)}
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
      <Label htmlFor={controlId} className="mb-2 text-muted-foreground">
        Watch Providers
      </Label>
      {popover}
    </div>
  );
}
