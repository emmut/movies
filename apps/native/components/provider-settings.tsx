import type { ProviderChoice } from '@movies/api/preferences';
import type { RegionCode } from '@movies/config/regions';
import { CatalogSectionState } from '@native/components/catalog-section-state';
import { CheckIcon } from '@native/components/icons';
import { SettingsSaveButton, SettingsSaveFeedback } from '@native/components/settings-controls';
import { accountQueryKey } from '@native/lib/account-query-key';
import { orpc, queryClient } from '@native/lib/api';
import { combineQueryStates } from '@native/lib/query-state';
import {
  commitSavedSetting,
  isUnauthorized,
  SETTINGS_LOGIN_HREF,
} from '@native/lib/settings-session';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Image as ExpoImage } from 'expo-image';
import { Redirect } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { withUniwind } from 'uniwind';

const Image = withUniwind(ExpoImage);

function ProviderLogo({ provider }: { provider: ProviderChoice }) {
  const [failed, setFailed] = useState(false);
  if (!provider.logoUrl || failed) {
    return (
      <View className="bg-default size-10 items-center justify-center rounded-md">
        <Text className="font-semibold text-foreground">
          {provider.name.charAt(0).toUpperCase()}
        </Text>
      </View>
    );
  }
  return (
    <Image
      source={provider.logoUrl}
      className="size-10 rounded-md"
      contentFit="contain"
      accessible={false}
      onError={() => setFailed(true)}
    />
  );
}

function ProviderRow({
  provider,
  checked,
  pending,
  toggle,
}: {
  provider: ProviderChoice;
  checked: boolean;
  pending: boolean;
  toggle: (id: number) => void;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={provider.name}
      aria-checked={checked}
      accessibilityState={{ checked, disabled: pending }}
      disabled={pending}
      className={
        'min-h-16 flex-row items-center gap-3 rounded-lg border p-3 ' +
        (checked ? 'bg-default border-foreground' : 'border-border')
      }
      onPress={() => toggle(provider.id)}
    >
      <ProviderLogo provider={provider} />
      <Text className="flex-1 text-sm font-medium text-foreground">{provider.name}</Text>
      {checked ? <CheckIcon className="size-5 text-foreground" accessible={false} /> : null}
    </Pressable>
  );
}

function StreamingIntroduction() {
  return (
    <View className="gap-1">
      <Text accessibilityRole="header" className="text-lg font-semibold text-foreground">
        Streaming Services
      </Text>
      <Text className="text-muted">
        Choose your preferred streaming services to filter content in Discover
      </Text>
    </View>
  );
}

function ProviderActions({
  pending,
  empty,
  clear,
  save,
}: {
  pending: boolean;
  empty: boolean;
  clear: () => void;
  save: () => void;
}) {
  const clearDisabled = pending || empty;
  return (
    <View className="flex-row flex-wrap gap-2">
      <Pressable
        accessibilityRole="button"
        disabled={clearDisabled}
        accessibilityState={{ disabled: clearDisabled }}
        className="min-h-12 items-center justify-center rounded-lg border border-border px-4"
        onPress={clear}
      >
        <Text className="font-semibold text-foreground">Clear All</Text>
      </Pressable>
      <SettingsSaveButton
        pending={pending}
        disabled={pending}
        label="Save Preferences"
        onSave={save}
      />
    </View>
  );
}

function providerKey(provider: ProviderChoice) {
  return String(provider.id);
}

function ProviderForm({
  choices,
  current,
  header,
  read,
  userId,
}: {
  choices: ProviderChoice[];
  current: number[];
  header: ReactNode;
  read: ReturnType<typeof combineQueryStates>;
  userId: string;
}) {
  const [draft, setDraft] = useState<number[] | null>(null);
  const selected = draft ?? current;
  const providersKey = accountQueryKey(orpc.preferences.providers.queryKey(), userId);
  const mutation = useMutation(
    orpc.preferences.setProviders.mutationOptions({
      async onSuccess(result) {
        await commitSavedSetting(queryClient, providersKey, result, () => setDraft(null));
        await queryClient.invalidateQueries({
          queryKey: accountQueryKey(orpc.systemLists.options.key(), userId),
        });
      },
    }),
  );
  const locked = mutation.isPending || !read.ready;
  function change(ids: number[]) {
    setDraft(ids);
    mutation.reset();
  }
  function toggle(id: number) {
    if (selected.includes(id)) {
      change(selected.filter((value) => value !== id));
      return;
    }
    change([...selected, id]);
  }
  return (
    <FlatList
      data={choices}
      keyExtractor={providerKey}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName="gap-3 px-5 pb-12"
      className="flex-1"
      ListHeaderComponent={
        <View className="gap-6 pt-5">
          {header}
          <View className="gap-4 rounded-xl border border-border p-4">
            <StreamingIntroduction />
            <ProviderControls read={read} mutation={mutation} selected={selected} change={change} />
          </View>
        </View>
      }
      renderItem={({ item }) => (
        <ProviderRow
          provider={item}
          checked={selected.includes(item.id)}
          pending={locked}
          toggle={toggle}
        />
      )}
      ListEmptyComponent={<ProviderEmpty ready={read.ready} />}
    />
  );
}

function ProviderControls({
  read,
  mutation,
  selected,
  change,
}: {
  read: ReturnType<typeof combineQueryStates>;
  mutation: ReturnType<
    typeof useMutation<{ providerIds: number[] }, Error, { providerIds: number[] }>
  >;
  selected: number[];
  change: (ids: number[]) => void;
}) {
  if (!read.ready) {
    return (
      <CatalogSectionState
        label="streaming preferences"
        pending={read.pending}
        failed={Boolean(read.error)}
        retry={read.retry}
      />
    );
  }
  return (
    <>
      <ProviderActions
        pending={mutation.isPending}
        empty={selected.length === 0}
        clear={() => change([])}
        save={() => mutation.mutate({ providerIds: selected })}
      />
      <SettingsSaveFeedback
        status={mutation.status}
        errorMessage="Failed to save preferences. Please try again."
        successMessage="Preferences saved!"
      />
    </>
  );
}

function ProviderEmpty({ ready }: { ready: boolean }) {
  if (!ready) {
    return null;
  }
  return (
    <Text className="py-4 text-center text-muted">
      No streaming services available for your region
    </Text>
  );
}

function ProviderAccess({ error, children }: { error: Error | null; children: ReactNode }) {
  if (isUnauthorized(error)) {
    return <Redirect href={SETTINGS_LOGIN_HREF} />;
  }
  return children;
}

export function ProviderSettings({
  region,
  header,
  userId,
}: {
  region: RegionCode;
  header: ReactNode;
  userId: string;
}) {
  const saved = useQuery({
    ...orpc.preferences.providers.queryOptions({ retry: false }),
    queryKey: accountQueryKey(orpc.preferences.providers.queryKey(), userId),
  });
  const choices = useQuery({
    ...orpc.preferences.providerOptions.queryOptions({ input: { region }, retry: false }),
    queryKey: accountQueryKey(
      orpc.preferences.providerOptions.queryKey({ input: { region } }),
      userId,
    ),
  });
  const state = combineQueryStates([saved, choices]);
  return (
    <ProviderAccess error={state.error}>
      <ProviderForm
        choices={choices.data ?? []}
        current={saved.data?.providerIds ?? []}
        header={header}
        read={state}
        userId={userId}
      />
    </ProviderAccess>
  );
}
