import { authClient } from '@native/lib/auth-client';
import { scalar } from '@native/lib/search-params';
import { runAccountLink } from '@native/lib/sign-in';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

const providers = [
  { id: 'discord', label: 'Link using Discord', className: 'bg-[#5865F2]' },
  { id: 'github', label: 'Link using GitHub', className: 'bg-[#24292e]' },
] as const;
type Provider = (typeof providers)[number]['id'];

export function LinkAccountSettings() {
  const [pending, setPending] = useState<Provider | null>(null);
  const [error, setError] = useState<string | null>(null);
  const params = useLocalSearchParams();
  const router = useRouter();
  const session = authClient.useSession();
  async function link(provider: Provider) {
    setPending(provider);
    setError(null);
    try {
      const failure = await runAccountLink(provider, '/more/settings');
      if (failure) {
        setError(failure);
        return;
      }
      await session.refetch();
      router.replace('/more/settings');
    } catch {
      setError('Couldn’t refresh your account. Please try again.');
    } finally {
      setPending(null);
    }
  }
  const routeError = scalar(params.error) === 'failed_to_link_account';
  const failure = error ?? (routeError ? 'Couldn’t link your account. Please try again.' : null);
  return (
    <View className="gap-4 rounded-xl border border-border p-4">
      <View className="gap-1">
        <Text accessibilityRole="header" className="text-lg font-semibold text-foreground">
          Link your account
        </Text>
        <Text className="text-muted">
          Link your account to your preferred social account to get access to more features.
        </Text>
      </View>
      {failure ? (
        <Text accessibilityRole="alert" className="text-red-600 dark:text-red-400">
          {failure}
        </Text>
      ) : null}
      {providers.map((provider) => (
        <Pressable
          key={provider.id}
          accessibilityRole="button"
          accessibilityLabel={provider.label}
          disabled={pending !== null}
          accessibilityState={{ disabled: pending !== null, busy: pending === provider.id }}
          className={'min-h-12 items-center justify-center rounded-xl px-4 ' + provider.className}
          onPress={() => {
            void link(provider.id);
          }}
        >
          {pending === provider.id ? (
            <ActivityIndicator accessibilityLabel="Linking account" />
          ) : (
            <Text className="font-semibold text-white">{provider.label}</Text>
          )}
        </Pressable>
      ))}
    </View>
  );
}
