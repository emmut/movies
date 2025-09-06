'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { setUserWatchProviders } from '@/lib/user-actions';
import { WatchProvider } from '@/types/watch-provider';
import { Check } from 'lucide-react';
import Image from 'next/image';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

interface WatchProviderFormProps {
  availableProviders: WatchProvider[];
  userProviders: number[];
}

export function WatchProviderForm({
  availableProviders,
  userProviders,
}: WatchProviderFormProps) {
  const [selectedProviders, setSelectedProviders] =
    useState<number[]>(userProviders);
  const [brokenImages, setBrokenImages] = useState<Set<number>>(new Set());
  const [isPending, startTransition] = useTransition();

  function handleProviderToggle(providerId: number) {
    setSelectedProviders((prev) =>
      prev.includes(providerId)
        ? prev.filter((id) => id !== providerId)
        : [...prev, providerId]
    );
  }

  function handleImageError(providerId: number) {
    setBrokenImages((prev) => new Set([...prev, providerId]));
  }

  async function handleSave() {
    startTransition(async () => {
      try {
        await setUserWatchProviders(selectedProviders);
        toast.success('Preferences saved!');
      } catch (error) {
        console.error('Error saving watch providers:', error);
        toast.error('Failed to save preferences. Please try again.');
      }
    });
  }
  }

  function handleClearAll() {
    setSelectedProviders([]);
  }

  const selectedCount = selectedProviders.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Streaming Services</CardTitle>
        <CardDescription>
          Choose your preferred streaming services to filter content in Discover
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={handleClearAll}
            disabled={selectedCount === 0}
          >
            Clear All
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? 'Saving...' : 'Save Preferences'}
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {availableProviders.length === 0 ? (
            <div className="text-muted-foreground col-span-full py-4 text-center">
              No streaming services available for your region
            </div>
          ) : (
            availableProviders.map((provider) => {
              const isSelected = selectedProviders.includes(
                provider.provider_id
              );
              const imageError = brokenImages.has(provider.provider_id);

              return (
                <div
                  key={provider.provider_id}
                  className={`hover:bg-accent cursor-pointer rounded-lg border p-3 transition-all ${
                    isSelected ? 'border-primary bg-accent' : 'border-border'
                  }`}
                  onClick={() => handleProviderToggle(provider.provider_id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      {imageError ? (
                        <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-md text-sm font-semibold">
                          {provider.provider_name.charAt(0).toUpperCase()}
                        </div>
                      ) : (
                        <Image
                          width={40}
                          height={40}
                          src={`https://image.tmdb.org/t/p/original${provider.logo_path}`}
                          alt={provider.provider_name}
                          className="h-10 w-10 rounded-md object-contain"
                          onError={() => handleImageError(provider.provider_id)}
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {provider.provider_name}
                      </p>
                    </div>
                    {isSelected && (
                      <Check className="text-primary h-4 w-4 flex-shrink-0" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
