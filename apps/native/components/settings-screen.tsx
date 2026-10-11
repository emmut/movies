import { getRegionByCode, type RegionCode } from '@movies/config/regions';
import { BottomNavigation } from '@native/components/bottom-navigation';
import { ProviderSettings } from '@native/components/provider-settings';
import { RegionPicker } from '@native/components/region-picker';
import { SettingsSaveButton, SettingsSaveFeedback } from '@native/components/settings-controls';
import { accountQueryKey } from '@native/lib/account-query-key';
import { orpc, queryClient } from '@native/lib/api';
import { authClient } from '@native/lib/auth-client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Redirect } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { SafeAreaView as NativeSafeAreaView } from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';

const SafeAreaView = withUniwind(NativeSafeAreaView);

function RegionForm({ currentRegion, userId }: { currentRegion: RegionCode; userId: string }) {
  const [draft, setDraft] = useState<RegionCode | null>(null);
  const selected = draft ?? currentRegion;
  const save = useMutation(
    orpc.preferences.setRegion.mutationOptions({
      async onSuccess(result) {
        queryClient.setQueryData(
          accountQueryKey(orpc.preferences.region.queryKey(), userId),
          result,
        );
        setDraft(null);
        await queryClient.invalidateQueries({
          queryKey: accountQueryKey(orpc.preferences.region.queryKey(), userId),
        });
      },
    }),
  );
  const disabled = save.isPending || selected === currentRegion;
  function chooseRegion(region: RegionCode) {
    setDraft(region);
    save.reset();
  }
  return (
    <View className="gap-4 rounded-xl border border-border p-4">
      <View className="gap-1">
        <Text accessibilityRole="header" className="text-lg font-semibold text-foreground">
          Region
        </Text>
        <Text className="text-muted">
          Choose your region to get relevant movies and streaming services
        </Text>
      </View>
      <RegionSelect selected={selected} pending={save.isPending} onSelect={chooseRegion} />
      <SettingsSaveButton
        pending={save.isPending}
        disabled={disabled}
        label="Save changes"
        onSave={() => save.mutate({ region: selected })}
      />
      <SettingsSaveFeedback
        status={save.status}
        errorMessage="Could not save region settings. Please try again."
        successMessage="Region settings saved!"
      />
    </View>
  );
}

function RegionSelect({
  selected,
  pending,
  onSelect,
}: {
  selected: RegionCode;
  pending: boolean;
  onSelect: (region: RegionCode) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const name = getRegionByCode(selected)?.name;
  return (
    <>
      <Text className="font-medium text-foreground">Region</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={'Region: ' + name}
        accessibilityState={{ disabled: pending }}
        disabled={pending}
        className="bg-default min-h-12 flex-row items-center justify-between rounded-lg border border-border px-4"
        onPress={() => setPickerOpen(true)}
      >
        <Text className="text-foreground">{name}</Text>
        <Text className="text-muted">⌄</Text>
      </Pressable>
      <RegionPicker
        visible={pickerOpen}
        selected={selected}
        onSelect={onSelect}
        onClose={() => setPickerOpen(false)}
      />
    </>
  );
}

function SettingsError({ message, retry }: { message: string; retry: () => void }) {
  return (
    <View className="gap-3 rounded-xl border border-border p-4">
      <Text accessibilityRole="alert" className="text-foreground">
        {message}
      </Text>
      <Pressable
        accessibilityRole="button"
        className="bg-default min-h-12 items-center justify-center rounded-lg px-4"
        onPress={retry}
      >
        <Text className="font-semibold text-foreground">Try again</Text>
      </Pressable>
    </View>
  );
}

function RegionReadError({ error, retry }: { error: Error; retry: () => void }) {
  if ('code' in error && error.code === 'UNAUTHORIZED') {
    return <Redirect href="/login?redirect_url=%2Fmore%2Fsettings" />;
  }
  return <SettingsError message="Couldn’t load region settings." retry={retry} />;
}

function RegionSettings({ userId }: { userId: string }) {
  const query = useQuery({
    ...orpc.preferences.region.queryOptions({ retry: false }),
    queryKey: accountQueryKey(orpc.preferences.region.queryKey(), userId),
  });
  if (query.isPending) {
    return <ActivityIndicator accessibilityLabel="Loading region settings" />;
  }
  if (query.isError) {
    return (
      <RegionReadError
        error={query.error}
        retry={() => {
          void query.refetch();
        }}
      />
    );
  }

  return (
    <ProviderSettings
      region={query.data.region}
      userId={userId}
      header={
        <>
          <SettingsIntroduction />
          <RegionForm currentRegion={query.data.region} userId={userId} />
        </>
      }
    />
  );
}

function AccountSettings() {
  const session = authClient.useSession();
  if (session.isPending) {
    return <ActivityIndicator accessibilityLabel="Loading session" />;
  }
  if (session.error) {
    return (
      <SettingsError
        message="Couldn’t verify your session."
        retry={() => {
          void session.refetch();
        }}
      />
    );
  }
  if (!session.data) {
    return <Redirect href="/login?redirect_url=%2Fmore%2Fsettings" />;
  }
  return <RegionSettings key={session.data.user.id} userId={session.data.user.id} />;
}

function SettingsIntroduction() {
  return (
    <View className="gap-1">
      <Text accessibilityRole="header" className="text-3xl font-bold text-foreground">
        Settings
      </Text>
      <Text className="text-muted">Manage your personal settings</Text>
    </View>
  );
}

export function SettingsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['left', 'right']}>
      <AccountSettings />
      <BottomNavigation />
    </SafeAreaView>
  );
}
