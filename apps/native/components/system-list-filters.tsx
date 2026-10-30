import type { SystemListPageInput } from '@movies/api/system-lists';
import { ChoiceSheet } from '@native/components/choice-sheet';
import { ChevronDownIcon } from '@native/components/icons';
import { RegionPicker } from '@native/components/region-picker';
import { accountQueryKey } from '@native/lib/account-query-key';
import { orpc } from '@native/lib/api';
import { toggleSelection } from '@native/lib/discover-state';
import { providerChoices } from '@native/lib/provider-choices';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

export function SystemListFilters({
  input,
  userId,
  change,
}: {
  input: Pick<SystemListPageInput, 'region' | 'providerIds'>;
  userId: string;
  change: (params: Record<string, string>) => void;
}) {
  const [open, setOpen] = useState<'providers' | 'region' | null>(null);
  const optionsInput = { region: input.region };
  const query = useQuery({
    ...orpc.systemLists.options.queryOptions({ input: optionsInput, retry: false }),
    queryKey: accountQueryKey(orpc.systemLists.options.queryKey({ input: optionsInput }), userId),
  });
  const choices = providerChoices(query.data ?? [], input.providerIds);
  const blocked = query.isPending || query.isError;
  return (
    <View className="gap-2">
      <View className="flex-row flex-wrap gap-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Providers"
          disabled={blocked}
          accessibilityState={{ disabled: blocked }}
          className="min-h-12 justify-center rounded-lg border border-border px-3"
          onPress={() => setOpen('providers')}
        >
          <Text className="text-foreground">Providers ({input.providerIds.length})</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Watch region"
          className="min-h-12 justify-center rounded-lg border border-border px-3"
          onPress={() => setOpen('region')}
        >
          <View className="flex-row items-center gap-1">
            <Text className="text-foreground">{input.region}</Text>
            <ChevronDownIcon className="size-4 text-foreground" accessible={false} />
          </View>
        </Pressable>
        <ClearProviders
          count={input.providerIds.length}
          clear={() => change({ with_watch_providers: '', page: '1' })}
        />
      </View>
      <ProviderError
        failed={query.isError}
        retry={() => {
          void query.refetch();
        }}
      />
      {open === 'providers' ? (
        <ChoiceSheet
          title="Providers"
          options={choices}
          selected={input.providerIds.map(String)}
          multiple
          onSelect={(value) =>
            change({
              with_watch_providers: toggleSelection(input.providerIds.map(String), value).join('|'),
              page: '1',
            })
          }
          onClose={() => setOpen(null)}
        />
      ) : null}
      <RegionPicker
        visible={open === 'region'}
        selected={input.region}
        onSelect={(region) => change({ watch_region: region, page: '1' })}
        onClose={() => setOpen(null)}
      />
    </View>
  );
}

function ClearProviders({ count, clear }: { count: number; clear: () => void }) {
  if (count === 0) {
    return null;
  }
  return (
    <Pressable accessibilityRole="button" className="min-h-12 justify-center px-3" onPress={clear}>
      <Text className="text-foreground">Clear providers</Text>
    </Pressable>
  );
}
function ProviderError({ failed, retry }: { failed: boolean; retry: () => void }) {
  if (!failed) {
    return null;
  }
  return (
    <Pressable accessibilityRole="button" onPress={retry} className="min-h-11 justify-center">
      <Text className="text-foreground">Couldn’t load providers. Try again.</Text>
    </Pressable>
  );
}
