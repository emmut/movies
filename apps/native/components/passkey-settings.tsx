import { passkeyNameSchema, formatPasskeyDate, type PasskeyMetadata } from '@movies/api/passkeys';
import { ScreenQueryState } from '@native/components/screen-query-state';
import { accountQueryKey } from '@native/lib/account-query-key';
import { queryClient } from '@native/lib/api';
import { authClient } from '@native/lib/auth-client';
import { addDevicePasskey, isPasskeySupported, readPasskeys } from '@native/lib/passkeys';
import { isUnauthorized, SETTINGS_LOGIN_HREF } from '@native/lib/settings-session';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Redirect, useFocusEffect } from 'expo-router';
import { useState, useCallback } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView as NativeSafeAreaView } from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';
const SafeAreaView = withUniwind(NativeSafeAreaView);

function passkeyName(key: PasskeyMetadata) {
  return key.name || 'Unnamed passkey';
}
function passkeyKey(userId: string) {
  return accountQueryKey(['passkeys'], userId);
}
async function refresh(userId: string) {
  await queryClient.invalidateQueries({ queryKey: passkeyKey(userId) });
}
function registrationMessage(error: unknown) {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    if (
      [
        'PASSKEY_CANCELLED',
        'ERROR_CEREMONY_ABORTED',
        'REGISTRATION_CANCELLED',
        'AUTH_CANCELLED',
      ].includes(String(error.code))
    ) {
      return 'Passkey setup was cancelled. You can try again.';
    }
  }
  return 'Couldn’t add your passkey. Please try again.';
}

function AddPasskey({ userId, close }: { userId: string; close: () => void }) {
  const [name, setName] = useState('My Passkey');
  const [error, setError] = useState<string | null>(null);
  const save = useMutation({
    async mutationFn(value: string) {
      const result = await addDevicePasskey(value);
      if (result.error) {
        throw new Error(registrationMessage(result.error));
      }
    },
    async onSuccess() {
      await refresh(userId);
      close();
    },
    onError(error) {
      setError(error.message);
    },
  });
  function dismiss() {
    if (!save.isPending) {
      close();
    }
  }
  function submit() {
    const parsed = passkeyNameSchema.safeParse(name);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setError(null);
    save.mutate(parsed.data);
  }
  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={dismiss}>
      <SafeAreaView className="flex-1 bg-background">
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerClassName="gap-5 p-5 pb-12"
            keyboardShouldPersistTaps="handled"
          >
            <Text accessibilityRole="header" className="text-xl font-bold text-foreground">
              Add New Passkey
            </Text>
            <Text className="text-muted">
              Give your passkey a name to help you identify it later. This could be the device name
              or location.
            </Text>
            <Text className="font-semibold text-foreground">Passkey Name</Text>
            <TextInput
              accessibilityLabel="Passkey Name"
              value={name}
              onChangeText={setName}
              maxLength={100}
              editable={!save.isPending}
              placeholder="e.g., MacBook Pro, iPhone, YubiKey"
              placeholderTextColorClassName="accent-muted"
              className="min-h-12 rounded-xl border border-border px-4 text-foreground"
            />
            {error ? (
              <Text accessibilityRole="alert" className="text-red-600 dark:text-red-400">
                {error}
              </Text>
            ) : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Confirm Add Passkey"
              disabled={save.isPending}
              accessibilityState={{ disabled: save.isPending }}
              className="min-h-12 items-center justify-center rounded-xl bg-foreground px-4"
              onPress={submit}
            >
              <Text className="font-semibold text-background">
                {save.isPending ? 'Adding…' : 'Add Passkey'}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cancel Add Passkey"
              disabled={save.isPending}
              className="bg-default min-h-12 items-center justify-center rounded-xl px-4"
              onPress={dismiss}
            >
              <Text className="text-foreground">Cancel</Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
function DeletePasskey({
  item,
  userId,
  close,
}: {
  item: PasskeyMetadata;
  userId: string;
  close: () => void;
}) {
  const mutation = useMutation({
    async mutationFn() {
      const result = await authClient.passkey.deletePasskey({ id: item.id });
      if (result.error) {
        throw new Error('Could not delete passkey');
      }
    },
    async onSuccess() {
      await refresh(userId);
      close();
    },
  });
  function dismiss() {
    if (!mutation.isPending) {
      close();
    }
  }
  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={dismiss}>
      <SafeAreaView className="flex-1 justify-center bg-background p-5">
        <View className="gap-5 rounded-xl border border-border p-5">
          <Text accessibilityRole="header" className="text-xl font-bold text-foreground">
            Delete Passkey
          </Text>
          <Text className="text-muted">
            Delete “{passkeyName(item)}”? You will no longer be able to use this passkey to sign in.
          </Text>
          {mutation.isError ? (
            <Text accessibilityRole="alert" className="text-red-600 dark:text-red-400">
              Couldn’t delete your passkey. Please try again.
            </Text>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Confirm Delete Passkey"
            disabled={mutation.isPending}
            className="min-h-12 items-center justify-center rounded-xl bg-red-700 px-4"
            onPress={() => mutation.mutate()}
          >
            <Text className="font-semibold text-white">
              {mutation.isPending ? 'Deleting…' : 'Delete Passkey'}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cancel Delete Passkey"
            disabled={mutation.isPending}
            className="bg-default min-h-12 items-center justify-center rounded-xl px-4"
            onPress={dismiss}
          >
            <Text className="text-foreground">Cancel</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
function PasskeyRows({
  items,
  remove,
}: {
  items: PasskeyMetadata[];
  remove: (item: PasskeyMetadata) => void;
}) {
  if (items.length === 0) {
    return (
      <Text className="text-sm text-foreground/75">
        No passkeys found. Add your first passkey to get started.
      </Text>
    );
  }
  return (
    <View className="gap-3">
      {items.map((item) => (
        <View key={item.id} className="gap-3 rounded-xl border border-border p-4">
          <Text className="font-semibold text-foreground">{passkeyName(item)}</Text>
          <Text className="text-sm text-foreground/75">
            {item.deviceType} · Created: {formatPasskeyDate(item.createdAt)}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={'Delete passkey ' + passkeyName(item)}
            className="min-h-12 items-center justify-center rounded-lg bg-red-700 px-4"
            onPress={() => remove(item)}
          >
            <Text className="font-semibold text-white">Delete</Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}
function PasskeyData({
  userId,
  remove,
}: {
  userId: string;
  remove: (item: PasskeyMetadata) => void;
}) {
  const query = useQuery({ queryKey: passkeyKey(userId), queryFn: readPasskeys, retry: false });
  const { refetch } = query;
  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );
  if (isUnauthorized(query.error)) {
    return <Redirect href={SETTINGS_LOGIN_HREF} />;
  }
  if (!query.data || query.isError) {
    return (
      <ScreenQueryState
        label="your passkeys"
        failed={query.isError}
        retry={() => {
          void query.refetch();
        }}
      />
    );
  }
  return <PasskeyRows items={query.data} remove={remove} />;
}
export function PasskeySettings({ userId }: { userId: string }) {
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<PasskeyMetadata | null>(null);
  const supported = isPasskeySupported();
  return (
    <View className="gap-4 rounded-xl border border-border p-4">
      <View className="gap-1">
        <Text accessibilityRole="header" className="text-lg font-semibold text-foreground">
          Passkeys
        </Text>
        <Text className="text-muted">
          Manage your passkeys for secure, passwordless authentication
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        disabled={!supported}
        accessibilityState={{ disabled: !supported }}
        className="min-h-12 items-center justify-center rounded-xl bg-foreground px-4"
        onPress={() => setAdding(true)}
      >
        <Text className="font-semibold text-background">Add Passkey</Text>
      </Pressable>
      {!supported ? (
        <Text className="text-sm text-foreground/75">
          Passkeys can’t be created here. You can still manage existing passkeys.
        </Text>
      ) : null}
      <PasskeyData userId={userId} remove={setDeleting} />
      {adding ? <AddPasskey userId={userId} close={() => setAdding(false)} /> : null}
      {deleting ? (
        <DeletePasskey item={deleting} userId={userId} close={() => setDeleting(null)} />
      ) : null}
    </View>
  );
}
