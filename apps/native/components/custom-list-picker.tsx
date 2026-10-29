import type { customListResourceInput } from '@movies/api/custom-lists';
import { CatalogSectionState } from '@native/components/catalog-section-state';
import { CustomListForm } from '@native/components/custom-list-form';
import { CheckIcon } from '@native/components/icons';
import { ScreenQueryState } from '@native/components/screen-query-state';
import { accountQueryKey } from '@native/lib/account-query-key';
import { orpc } from '@native/lib/api';
import { authClient } from '@native/lib/auth-client';
import { refreshCustomLists } from '@native/lib/custom-lists';
import { useCurrentUrl } from '@native/lib/use-current-url';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
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
  const query = useQuery({
    ...orpc.customLists.status.queryOptions({ input, retry: false }),
    queryKey: accountQueryKey(orpc.customLists.status.queryKey({ input }), userId),
  });
  const add = useMutation(
    orpc.customLists.add.mutationOptions({ onSettled: () => refreshCustomLists(userId) }),
  );
  const remove = useMutation(
    orpc.customLists.remove.mutationOptions({ onSettled: () => refreshCustomLists(userId) }),
  );
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
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={dismiss}>
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
        {!query.data || query.isError ? (
          <ScreenQueryState
            label="your lists"
            failed={query.isError}
            retry={() => {
              void query.refetch();
            }}
          />
        ) : (
          <ScrollView contentContainerClassName="gap-3 p-5 pb-12">
            {add.isError || remove.isError ? (
              <Text accessibilityRole="alert" className="text-red-600 dark:text-red-400">
                Couldn’t update your list. Please try again.
              </Text>
            ) : null}
            {query.data.length === 0 ? (
              <Text className="text-muted">Create your first list to save this item.</Text>
            ) : null}
            {query.data.map((item) => (
              <Pressable
                key={item.id}
                accessibilityRole="checkbox"
                accessibilityLabel={item.name}
                accessibilityState={{
                  checked: item.hasItem,
                  disabled: pending || query.isFetching,
                }}
                aria-checked={item.hasItem}
                disabled={pending || query.isFetching}
                className="bg-default min-h-16 flex-row items-center gap-3 rounded-xl border border-border p-4"
                onPress={() => {
                  const mutation = item.hasItem ? remove : add;
                  mutation.mutate({ ...input, listId: item.id });
                }}
              >
                <Text className="text-2xl">{item.emoji}</Text>
                <View className="flex-1 gap-1">
                  <Text className="font-semibold text-foreground">{item.name}</Text>
                  <Text className="text-sm text-muted">{item.itemCount} items</Text>
                </View>
                {item.hasItem ? (
                  <CheckIcon className="size-5 text-yellow-500" accessible={false} />
                ) : null}
              </Pressable>
            ))}
            <Pressable
              accessibilityRole="button"
              disabled={pending}
              className="min-h-12 items-center justify-center rounded-xl bg-foreground px-4"
              onPress={() => setCreating(true)}
            >
              <Text className="font-semibold text-background">Create New List</Text>
            </Pressable>
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
}

export function CustomListActions({ input }: { input: Resource }) {
  const session = authClient.useSession();
  const returnUrl = useCurrentUrl();
  const [open, setOpen] = useState(false);
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
        <CustomListPicker
          key={session.data.user.id}
          input={input}
          userId={session.data.user.id}
          close={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}
