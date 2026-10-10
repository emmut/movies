import type { CatalogDetailInput } from '@movies/api/catalog';
import type { ProviderGroups, WatchProviderCard } from '@movies/api/catalog-support';
import { getRegionByCode } from '@movies/config/regions';
import { useQuery } from '@tanstack/react-query';
import { Image as ExpoImage } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Linking, Pressable, Text, View } from 'react-native';
import { withUniwind } from 'uniwind';

import { orpc } from '../lib/api';
import { CatalogIcon } from './catalog-icon';
import { CatalogSectionState } from './catalog-section-state';
import { ExternalLink } from './external-link';
import { RegionPicker } from './region-picker';

const Image = withUniwind(ExpoImage);
const providerKinds = [
  { key: 'free', label: 'Free', accent: 'text-blue-500' },
  { key: 'streaming', label: 'Streaming', accent: 'text-green-500' },
  { key: 'rent', label: 'Rent', accent: 'text-blue-500' },
  { key: 'buy', label: 'Buy', accent: 'text-yellow-500' },
] as const;
function ProviderCard({ provider, href }: { provider: WatchProviderCard; href: string }) {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${provider.name} (opens browser)`}
      className="min-h-14 flex-row items-center gap-3 rounded-lg bg-zinc-800 p-3"
      onPress={() => {
        void Linking.openURL(href).catch(() =>
          Alert.alert('Couldn’t open provider', 'Please try again.'),
        );
      }}
    >
      <Image
        source={provider.logoUrl}
        contentFit="contain"
        className="size-8 rounded"
        accessible={false}
      />
      <Text className="flex-1 text-sm font-medium text-white">{provider.name}</Text>
    </Pressable>
  );
}
function ProviderContent({ groups }: { groups: ProviderGroups }) {
  const empty = providerKinds.every((kind) => groups[kind.key].length === 0);
  return (
    <View className="gap-6">
      {empty ? (
        <Text className="rounded-lg bg-zinc-800 p-6 text-center text-zinc-400">
          No services available for this region
        </Text>
      ) : null}
      {providerKinds.map((kind) =>
        groups[kind.key].length > 0 ? (
          <View key={kind.key} className="gap-3">
            <View className="flex-row items-center gap-2">
              <CatalogIcon label={kind.label} className={kind.accent} />
              <Text accessibilityRole="header" className="text-lg font-medium text-foreground">
                {kind.label}
              </Text>
            </View>
            {groups[kind.key].map((provider) => (
              <ProviderCard key={provider.id} provider={provider} href={groups.link} />
            ))}
          </View>
        ) : null,
      )}
      <View className="gap-2 rounded-lg bg-default p-3">
        <Text className="text-center text-sm text-foreground">
          Powered by JustWatch via TMDB API
        </Text>
        <View className="flex-row justify-center gap-2">
          <ExternalLink href="https://www.justwatch.com">JustWatch</ExternalLink>
          <ExternalLink href="https://www.themoviedb.org">TMDB API</ExternalLink>
        </View>
      </View>
    </View>
  );
}
function useWatchRegion(defaultRegion: string) {
  const { watchRegion } = useLocalSearchParams<{ watchRegion?: string }>();
  const fallback = getRegionByCode(defaultRegion);
  if (!fallback) throw new Error('Unsupported watch region');
  return getRegionByCode(watchRegion ?? defaultRegion) ?? fallback;
}

export function CatalogProviders({ input }: { input: CatalogDetailInput }) {
  const region = useWatchRegion(input.region);
  const router = useRouter();
  const selected = region.code;
  const [pickerOpen, setPickerOpen] = useState(false);
  const query = useQuery(
    orpc.catalog.providers.queryOptions({ input: { ...input, region: selected }, retry: false }),
  );
  return (
    <View className="gap-4">
      <Text accessibilityRole="header" className="text-xl font-semibold text-foreground">
        Where to watch
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Watch region: ${region.name}. Change region`}
        onPress={() => setPickerOpen(true)}
        className="self-start rounded-xl bg-default px-4 py-3"
      >
        <Text className="text-foreground">{region.name} ▾</Text>
      </Pressable>
      <CatalogSectionState
        label="watch providers"
        pending={query.isPending}
        failed={query.isError}
        retry={() => {
          void query.refetch();
        }}
      />
      {query.data ? <ProviderContent groups={query.data} /> : null}
      <RegionPicker
        visible={pickerOpen}
        selected={selected}
        onSelect={(code) => router.setParams({ watchRegion: code })}
        onClose={() => setPickerOpen(false)}
      />
    </View>
  );
}
