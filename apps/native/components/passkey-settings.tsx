import {
  classifyPasskeyError,
  deviceTypeLabel,
  formatPasskeyDate,
  passkeyFailureMessage,
  passkeyNameSchema,
  type PasskeyMetadata,
} from '@movies/api/passkeys';
import { ScreenQueryState } from '@native/components/screen-query-state';
import { Sheet } from '@native/components/sheet';
import { passkeyKey, usePasskeys } from '@native/hooks/use-passkeys-query';
import { queryClient } from '@native/lib/api';
import { authClient } from '@native/lib/auth-client';
import { addDevicePasskey, isPasskeySupported } from '@native/lib/passkeys';
import { isUnauthorized, SETTINGS_LOGIN_HREF } from '@native/lib/settings-session';
import { useMutation } from '@tanstack/react-query';
import { Redirect } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
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

async function refresh(userId: string) {
  await queryClient.invalidateQueries({ queryKey: passkeyKey(userId) });
}

/** Thrown to keep the sheet open without a message after a dismissed OS prompt. */
class PasskeyPromptDismissed extends Error {}

function registrationFailure(error: unknown) {
  const message = passkeyFailureMessage(
    classifyPasskeyError(error),
    'Couldn’t add your passkey. Please try again.',
  );
  if (message === null) {
    return new PasskeyPromptDismissed();
  }
  return new Error(message);
}

type NameSheetProps = {
  title: string;
  /** Names the sheet's buttons for assistive tech, e.g. "Confirm Add Passkey". */
  action: string;
  description: string;
  initialName: string;
  submitLabel: string;
  pendingLabel: string;
  /** Saves the validated name; a thrown error's message is shown in the sheet. */
  save: (name: string) => Promise<void>;
  close: () => void;
};

/** Sheet with a single passkey-name field, shared by adding and renaming. */
function PasskeyNameSheet({
  title,
  action,
  description,
  initialName,
  submitLabel,
  pendingLabel,
  save,
  close,
}: NameSheetProps) {
  const [name, setName] = useState(initialName);
  const [error, setError] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: save,
    onSuccess: close,
    onError(error) {
      if (error instanceof PasskeyPromptDismissed) {
        return;
      }
      setError(error.message);
    },
  });
  function dismiss() {
    if (!mutation.isPending) {
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
    mutation.mutate(parsed.data);
  }
  return (
    <Sheet visible onRequestClose={dismiss}>
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
              {title}
            </Text>
            <Text className="text-muted">{description}</Text>
            <Text className="font-semibold text-foreground">Passkey Name</Text>
            <TextInput
              accessibilityLabel="Passkey Name"
              value={name}
              onChangeText={setName}
              maxLength={100}
              editable={!mutation.isPending}
              placeholder="e.g., MacBook Pro, iPhone, YubiKey"
              placeholderTextColorClassName="accent-muted"
              returnKeyType="done"
              onSubmitEditing={submit}
              className="min-h-12 rounded-xl border border-border px-4 text-foreground"
            />
            {error ? (
              <Text accessibilityRole="alert" className="text-red-600 dark:text-red-400">
                {error}
              </Text>
            ) : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={'Confirm ' + action}
              disabled={mutation.isPending}
              accessibilityState={{ disabled: mutation.isPending }}
              className="min-h-12 items-center justify-center rounded-xl bg-foreground px-4"
              onPress={submit}
            >
              <Text className="font-semibold text-background">
                {mutation.isPending ? pendingLabel : submitLabel}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={'Cancel ' + action}
              disabled={mutation.isPending}
              className="bg-default min-h-12 items-center justify-center rounded-xl px-4"
              onPress={dismiss}
            >
              <Text className="text-foreground">Cancel</Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Sheet>
  );
}

function AddPasskey({ userId, close }: { userId: string; close: () => void }) {
  async function save(name: string) {
    const result = await addDevicePasskey(name);
    if (result.error) {
      throw registrationFailure(result.error);
    }
    await refresh(userId);
  }
  return (
    <PasskeyNameSheet
      title="Add New Passkey"
      action="Add Passkey"
      description="Give your passkey a name to help you identify it later. This could be the device name or location."
      initialName="My Passkey"
      submitLabel="Add Passkey"
      pendingLabel="Adding…"
      save={save}
      close={close}
    />
  );
}

function RenamePasskey({
  item,
  userId,
  close,
}: {
  item: PasskeyMetadata;
  userId: string;
  close: () => void;
}) {
  async function save(name: string) {
    const result = await authClient.passkey.updatePasskey({ id: item.id, name });
    if (result.error) {
      throw new Error('Couldn’t rename your passkey. Please try again.');
    }
    await refresh(userId);
  }
  return (
    <PasskeyNameSheet
      title="Rename Passkey"
      action="Rename Passkey"
      description="Choose a name that helps you recognise this passkey."
      initialName={item.name ?? ''}
      submitLabel="Save"
      pendingLabel="Saving…"
      save={save}
      close={close}
    />
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
    <Sheet visible onRequestClose={dismiss}>
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
    </Sheet>
  );
}

type ItemActions = {
  rename: (item: PasskeyMetadata) => void;
  remove: (item: PasskeyMetadata) => void;
};

function PasskeyRow({ item, rename, remove }: { item: PasskeyMetadata } & ItemActions) {
  const name = passkeyName(item);
  return (
    <View className="gap-3 rounded-xl border border-border p-4">
      <Text className="font-semibold text-foreground">{name}</Text>
      <Text className="text-sm text-foreground/75">
        {deviceTypeLabel(item.deviceType)} · Created: {formatPasskeyDate(item.createdAt)}
      </Text>
      <View className="flex-row gap-3">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={'Rename passkey ' + name}
          className="min-h-12 flex-1 items-center justify-center rounded-lg border border-border px-4"
          onPress={() => rename(item)}
        >
          <Text className="font-semibold text-foreground">Rename</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={'Delete passkey ' + name}
          className="min-h-12 flex-1 items-center justify-center rounded-lg bg-red-700 px-4"
          onPress={() => remove(item)}
        >
          <Text className="font-semibold text-white">Delete</Text>
        </Pressable>
      </View>
    </View>
  );
}

function PasskeyRows({ items, ...actions }: { items: PasskeyMetadata[] } & ItemActions) {
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
        <PasskeyRow key={item.id} item={item} {...actions} />
      ))}
    </View>
  );
}

function PasskeyData({ userId, ...actions }: { userId: string } & ItemActions) {
  const query = usePasskeys(userId);
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
  return <PasskeyRows items={query.data} {...actions} />;
}

type ActiveSheet =
  | { kind: 'add' }
  | { kind: 'rename'; item: PasskeyMetadata }
  | { kind: 'delete'; item: PasskeyMetadata };

function PasskeySheet({
  sheet,
  userId,
  close,
}: {
  sheet: ActiveSheet;
  userId: string;
  close: () => void;
}) {
  switch (sheet.kind) {
    case 'add':
      return <AddPasskey userId={userId} close={close} />;
    case 'rename':
      return <RenamePasskey item={sheet.item} userId={userId} close={close} />;
    case 'delete':
      return <DeletePasskey item={sheet.item} userId={userId} close={close} />;
  }
}

export function PasskeySettings({ userId }: { userId: string }) {
  const [sheet, setSheet] = useState<ActiveSheet | null>(null);
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
        onPress={() => setSheet({ kind: 'add' })}
      >
        <Text className="font-semibold text-background">Add Passkey</Text>
      </Pressable>
      {!supported ? (
        <Text className="text-sm text-foreground/75">
          Passkeys can’t be created here. You can still manage existing passkeys.
        </Text>
      ) : null}
      <PasskeyData
        userId={userId}
        rename={(item) => setSheet({ kind: 'rename', item })}
        remove={(item) => setSheet({ kind: 'delete', item })}
      />
      {sheet ? <PasskeySheet sheet={sheet} userId={userId} close={() => setSheet(null)} /> : null}
    </View>
  );
}
