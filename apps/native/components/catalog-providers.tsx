import type { CatalogDetailInput } from '@movies/api/catalog';
import type { ProviderGroups, WatchProviderCard } from '@movies/api/catalog-support';
import { useCatalogProviders, useCatalogWatchLinks } from '@movies/api/react/use-catalog-query';
import type { DirectWatchLink } from '@movies/api/tmdb-types/watch-provider';
import { getDirectWatchUrl } from '@movies/api/watch-links';
import { getRegionByCode } from '@movies/config/regions';
import { CatalogIcon } from '@native/components/catalog-icon';
import { CatalogSectionState } from '@native/components/catalog-section-state';
import { ExternalLink } from '@native/components/external-link';
import { ChevronDownIcon } from '@native/components/icons';
import { RegionPicker } from '@native/components/region-picker';
import { Image as ExpoImage } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Linking, Pressable, Text, View } from 'react-native';
import { withUniwind } from 'uniwind';

const Image = withUniwind(ExpoImage);
const providerKinds = [
  { key: 'free', offer: 'free', label: 'Free', accent: 'text-blue-500' },
  { key: 'ads', offer: 'ads', label: 'Free with ads', accent: 'text-blue-500' },
  { key: 'streaming', offer: 'flatrate', label: 'Streaming', accent: 'text-green-500' },
  { key: 'rent', offer: 'rent', label: 'Rent', accent: 'text-blue-500' },
  { key: 'buy', offer: 'buy', label: 'Buy', accent: 'text-yellow-500' },
] as const;
type ProviderKind = (typeof providerKinds)[number];

function ProviderCard({ provider, href }: { provider: WatchProviderCard; href: string }) {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${provider.name} (opens browser)`}
      className="bg-default min-h-14 flex-row items-center gap-3 rounded-lg p-3"
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
      <Text className="flex-1 text-sm font-medium text-foreground">{provider.name}</Text>
    </Pressable>
  );
}
function ProviderSection({
  kind,
  groups,
  links,
  region,
}: {
  kind: ProviderKind;
  groups: ProviderGroups;
  links: DirectWatchLink[];
  region: string;
}) {
  const providers = groups[kind.key];
  if (providers.length === 0) {
    return null;
  }
  return (
    <View className="gap-3">
      <View className="flex-row items-center gap-2">
        <CatalogIcon label={kind.label} className={kind.accent} />
        <Text accessibilityRole="header" className="text-lg font-medium text-foreground">
          {kind.label}
        </Text>
      </View>
      {providers.map((provider) => {
        const directUrl = getDirectWatchUrl(links, provider.id, region, kind.offer);
        return (
          <ProviderCard key={provider.id} provider={provider} href={directUrl ?? groups.link} />
        );
      })}
    </View>
  );
}
function ProviderContent({
  groups,
  links,
  region,
}: {
  groups: ProviderGroups;
  links: DirectWatchLink[];
  region: string;
}) {
  const empty = providerKinds.every((kind) => groups[kind.key].length === 0);
  return (
    <View className="gap-6">
      {empty ? (
        <Text className="bg-default rounded-lg p-6 text-center text-muted">
          No services available for this region
        </Text>
      ) : null}
      {providerKinds.map((kind) => (
        <ProviderSection key={kind.key} kind={kind} groups={groups} links={links} region={region} />
      ))}
      <View className="bg-default gap-2 rounded-lg p-3">
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
  if (!fallback) {
    throw new Error('Unsupported watch region');
  }
  return getRegionByCode(watchRegion ?? defaultRegion) ?? fallback;
}

export function CatalogProviders({ input }: { input: CatalogDetailInput }) {
  const region = useWatchRegion(input.region);
  const router = useRouter();
  const selected = region.code;
  const links = useCatalogWatchLinks({ id: input.id, type: input.type });
  const [pickerOpen, setPickerOpen] = useState(false);
  const query = useCatalogProviders({ ...input, region: selected });
  return (
    <View className="gap-4">
      <Text accessibilityRole="header" className="text-xl font-semibold text-foreground">
        Where to watch
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Watch region: ${region.name}. Change region`}
        onPress={() => setPickerOpen(true)}
        className="bg-default self-start rounded-xl px-4 py-3"
      >
        <View className="flex-row items-center gap-1">
          <Text className="text-foreground">{region.name}</Text>
          <ChevronDownIcon className="size-4 text-foreground" accessible={false} />
        </View>
      </Pressable>
      <CatalogSectionState
        label="watch providers"
        pending={query.isPending}
        failed={query.isError}
        retry={() => {
          void query.refetch();
        }}
      />
      {query.data ? (
        <ProviderContent groups={query.data} links={links.data ?? []} region={selected} />
      ) : null}
      <RegionPicker
        visible={pickerOpen}
        selected={selected}
        onSelect={(code) => router.setParams({ watchRegion: code })}
        onClose={() => setPickerOpen(false)}
      />
    </View>
  );
}
