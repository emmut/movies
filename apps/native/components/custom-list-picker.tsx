import type { CustomListStatus, customListResourceInput } from '@movies/api/custom-lists';
import {
  useCustomListsAddMutation,
  useCustomListsRemoveMutation,
  useCustomListsStatus,
} from '@movies/api/react/use-custom-lists-query';
import { CatalogSectionState } from '@native/components/catalog-section-state';
import { CustomListForm } from '@native/components/custom-list-form';
import { CheckIcon } from '@native/components/icons';
import { ListMutationError } from '@native/components/list-mutation-error';
import { ScreenQueryState } from '@native/components/screen-query-state';
import { Sheet } from '@native/components/sheet';
import { authClient } from '@native/lib/auth-client';
import { useCurrentUrl } from '@native/lib/use-current-url';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView as NativeSafeAreaView } from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';
import type { z } from 'zod';
const SafeAreaView = withUniwind(NativeSafeAreaView);
type Resource = z.infer<typeof customListResourceInput>;

export function CustomListPicker({
  input,
  userId,
  close,
}: {
  input: Resource;
  userId: string;
  close: () => void;
}) {
  const [creating, setCreating] = useState(false);
  const query = useCustomListsStatus(userId, input);
  const add = useCustomListsAddMutation({ accountId: userId });
  const remove = useCustomListsRemoveMutation({ accountId: userId });
  const pending = add.isPending || remove.isPending;
  function dismiss() {
    if (!pending) {
      close();
    }
  }
  if (creating) {
    return (
      <CustomListForm
        userId={userId}
        close={() => setCreating(false)}
        created={(listId) => add.mutate({ ...input, listId })}
      />
    );
  }
  return (
    <Sheet visible onRequestClose={dismiss}>
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-row items-center justify-between p-5">
          <Text accessibilityRole="header" className="text-xl font-bold text-foreground">
            Add to Lists
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close Add to Lists"
            disabled={pending}
            className="bg-default min-h-12 justify-center rounded-lg px-4"
            onPress={dismiss}
          >
            <Text className="text-foreground">Done</Text>
          </Pressable>
        </View>
        <PickerQueryContents
          query={query}
          pending={pending}
          failed={add.isError || remove.isError}
          toggle={(item) => {
            const mutation = item.hasItem ? remove : add;
            mutation.mutate({ ...input, listId: item.id });
          }}
          create={() => setCreating(true)}
        />
      </SafeAreaView>
    </Sheet>
  );
}

export function CustomListActions({ input }: { input: Resource }) {
  const session = authClient.useSession();
  const returnUrl = useCurrentUrl();
  if (session.isPending || session.error) {
    return (
      <CatalogSectionState
        label="custom list actions"
        pending={session.isPending}
        failed={Boolean(session.error)}
        retry={() => {
          void session.refetch();
        }}
      />
    );
  }
  if (!session.data) {
    return (
      <Link href={{ pathname: '/login', params: { redirect_url: returnUrl } }} asChild>
        <Pressable
          accessibilityRole="link"
          className="bg-default min-h-12 justify-center self-start rounded-lg px-4"
        >
          <Text className="font-semibold text-foreground">Sign in to save to Lists</Text>
        </Pressable>
      </Link>
    );
  }
  return <AuthenticatedListActions input={input} userId={session.data.user.id} />;
}
function AuthenticatedListActions({ input, userId }: { input: Resource; userId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable
        accessibilityRole="button"
        className="bg-default min-h-12 justify-center self-start rounded-lg border border-border px-4"
        onPress={() => setOpen(true)}
      >
        <Text className="font-semibold text-foreground">Add to Lists</Text>
      </Pressable>
      {open ? (
        <CustomListPicker key={userId} input={input} userId={userId} close={() => setOpen(false)} />
      ) : null}
    </>
  );
}

function PickerContents({
  items,
  disabled,
  failed,
  pending,
  toggle,
  create,
}: {
  items: CustomListStatus;
  disabled: boolean;
  failed: boolean;
  pending: boolean;
  toggle: (item: CustomListStatus[number]) => void;
  create: () => void;
}) {
  return (
    <ScrollView contentContainerClassName="gap-3 p-5 pb-12">
      <ListMutationError failed={failed} />
      {items.length === 0 ? (
        <Text className="text-muted">Create your first list to save this item.</Text>
      ) : null}
      {items.map((item) => (
        <PickerRow key={item.id} item={item} disabled={disabled} toggle={() => toggle(item)} />
      ))}
      <Pressable
        accessibilityRole="button"
        disabled={pending}
        className="min-h-12 items-center justify-center rounded-xl bg-foreground px-4"
        onPress={create}
      >
        <Text className="font-semibold text-background">Create New List</Text>
      </Pressable>
    </ScrollView>
  );
}
function PickerRow({
  item,
  disabled,
  toggle,
}: {
  item: CustomListStatus[number];
  disabled: boolean;
  toggle: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={item.name}
      accessibilityState={{
        checked: item.hasItem,
        disabled,
      }}
      aria-checked={item.hasItem}
      disabled={disabled}
      className="bg-default min-h-16 flex-row items-center gap-3 rounded-xl border border-border p-4"
      onPress={toggle}
    >
      <Text className="text-2xl">{item.emoji}</Text>
      <View className="flex-1 gap-1">
        <Text className="font-semibold text-foreground">{item.name}</Text>
        <Text className="text-sm text-muted">{item.itemCount} items</Text>
      </View>
      {item.hasItem ? <CheckIcon className="size-5 text-yellow-500" accessible={false} /> : null}
    </Pressable>
  );
}

function PickerQueryContents({
  query,
  pending,
  failed,
  toggle,
  create,
}: {
  query: ReturnType<typeof useCustomListsStatus>;
  pending: boolean;
  failed: boolean;
  toggle: (item: CustomListStatus[number]) => void;
  create: () => void;
}) {
  if (!query.data || query.isError) {
    return (
      <ScreenQueryState
        label="your lists"
        failed={query.isError}
        retry={() => {
          void query.refetch();
        }}
      />
    );
  }
  return (
    <PickerContents
      items={query.data}
      disabled={pending || query.isFetching}
      failed={failed}
      pending={pending}
      toggle={toggle}
      create={create}
    />
  );
}
