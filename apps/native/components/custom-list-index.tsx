import type { CustomListSummary } from '@movies/api/custom-lists';
import { AccountScreen } from '@native/components/account-screen';
import { CustomListDialogs } from '@native/components/custom-list-dialogs';
import { CustomListScroll } from '@native/components/custom-list-scroll';
import { ListMoveControls, ListPageControls } from '@native/components/list-controls';
import { ScreenQueryState } from '@native/components/screen-query-state';
import { useScrollNavigation } from '@native/components/scroll-navigation';
import { accountQueryKey } from '@native/lib/account-query-key';
import { orpc } from '@native/lib/api';
import { refreshCustomLists } from '@native/lib/custom-lists';
import { listPage } from '@native/lib/list-page-state';
import { useCanonicalListPage } from '@native/lib/use-canonical-list-page';
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

function ListCard({
  item,
  blocked,
  edit,
  remove,
}: {
  item: CustomListSummary;
  blocked: boolean;
  edit: () => void;
  remove: () => void;
}) {
  const navigationPress = useScrollNavigation();
  return (
    <View
      testID={'custom-list-card-' + item.id}
      className="bg-default gap-3 rounded-xl border border-border p-4"
    >
      <Link href={{ pathname: '/more/lists/[listId]', params: { listId: item.id } }} asChild>
        <Pressable
          {...navigationPress}
          accessibilityRole="link"
          accessibilityLabel={'Open list ' + item.name}
          className="min-h-20 flex-row items-center gap-4"
        >
          <Text className="text-4xl text-foreground">{item.emoji}</Text>
          <View className="flex-1 gap-1">
            <Text numberOfLines={2} className="text-xl font-semibold text-foreground">
              {item.name}
            </Text>
            {item.description ? (
              <Text numberOfLines={3} className="text-foreground/75">
                {item.description}
              </Text>
            ) : null}
            <Text className="text-sm text-foreground/75">
              {item.itemCount} {item.itemCount === 1 ? 'item' : 'items'}
            </Text>
          </View>
        </Pressable>
      </Link>
      <View className="flex-row gap-3">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={'Edit ' + item.name}
          disabled={blocked}
          className="bg-default min-h-12 justify-center rounded-lg px-4"
          onPress={edit}
        >
          <Text className="text-foreground">Edit</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={'Delete ' + item.name}
          disabled={blocked}
          className="bg-default min-h-12 justify-center rounded-lg px-4"
          onPress={remove}
        >
          <Text className="text-foreground">Delete</Text>
        </Pressable>
      </View>
    </View>
  );
}
function ListIndex({ userId }: { userId: string }) {
  const params = useLocalSearchParams();
  const router = useRouter();
  const page = listPage(params.page);
  const input = { page };
  const [editor, setEditor] = useState<CustomListSummary | 'create' | null>(null);
  const [deleting, setDeleting] = useState<CustomListSummary | null>(null);
  const [reordering, setReordering] = useState(false);
  const query = useQuery({
    ...orpc.customLists.index.queryOptions({ input, retry: false }),
    queryKey: accountQueryKey(orpc.customLists.index.queryKey({ input }), userId),
    placeholderData: keepPreviousData,
  });
  const move = useMutation(
    orpc.customLists.move.mutationOptions({ onSuccess: () => refreshCustomLists(userId) }),
  );
  useCanonicalListPage(query, page);
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
  const result = query.data;
  const blocked = query.isFetching || move.isPending;
  const offset = (result.currentPage - 1) * result.itemsPerPage;
  return (
    <>
      <CustomListScroll memoryKey={'custom-lists:' + userId + ':' + result.currentPage}>
        <IndexHeader
          total={result.totalItems}
          blocked={blocked}
          reordering={reordering}
          create={() => setEditor('create')}
          toggleReorder={() => setReordering(!reordering)}
        />
        {move.isError ? (
          <Text accessibilityRole="alert" className="text-red-600 dark:text-red-400">
            Couldn’t reorder your lists. Please try again.
          </Text>
        ) : null}
        <IndexRows
          items={result.lists}
          order={{ offset, total: result.totalItems, pending: blocked, enabled: reordering }}
          edit={setEditor}
          remove={setDeleting}
          move={(item, position) => move.mutate({ listId: item.id, position })}
        />
        <IndexEmpty total={result.totalItems} />
        <ListPageControls
          page={result.currentPage}
          pages={result.totalPages}
          blocked={blocked}
          change={(value) => router.setParams({ page: String(value) })}
        />
      </CustomListScroll>
      <CustomListDialogs
        userId={userId}
        editor={editor}
        deleting={deleting}
        closeEditor={() => setEditor(null)}
        closeDelete={() => setDeleting(null)}
      />
    </>
  );
}
export function CustomListIndexScreen() {
  return <AccountScreen>{(userId) => <ListIndex userId={userId} />}</AccountScreen>;
}

function IndexHeader({
  total,
  blocked,
  reordering,
  create,
  toggleReorder,
}: {
  total: number;
  blocked: boolean;
  reordering: boolean;
  create: () => void;
  toggleReorder: () => void;
}) {
  return (
    <>
      <View className="gap-3">
        <Text accessibilityRole="header" className="text-3xl font-bold text-foreground">
          My Lists
        </Text>
        <Text className="text-foreground/75">
          {total} {total === 1 ? 'list' : 'lists'} created
        </Text>
        <Pressable
          accessibilityRole="button"
          className="min-h-12 items-center justify-center rounded-xl bg-foreground px-4"
          onPress={create}
        >
          <Text className="font-semibold text-background">Create New List</Text>
        </Pressable>
      </View>
      {total > 1 ? (
        <Pressable
          accessibilityRole="button"
          disabled={blocked}
          className="bg-default min-h-12 justify-center self-start rounded-lg px-4"
          onPress={toggleReorder}
        >
          <Text className="text-foreground">
            {reordering ? 'Done reordering' : 'Reorder lists'}
          </Text>
        </Pressable>
      ) : null}
    </>
  );
}
function IndexEmpty({ total }: { total: number }) {
  if (total > 0) {
    return null;
  }
  return (
    <View className="items-center gap-3 py-12">
      <Text className="text-5xl">📝</Text>
      <Text
        accessibilityRole="header"
        className="text-center text-xl font-semibold text-foreground"
      >
        You haven’t created any lists yet
      </Text>
      <Text className="text-center text-muted">
        Create a list above or save a movie, TV show or person from their page.
      </Text>
      <Link href="/discover" asChild>
        <Pressable className="bg-default min-h-12 justify-center rounded-xl px-4">
          <Text className="text-foreground">Explore Movies &amp; TV Shows</Text>
        </Pressable>
      </Link>
    </View>
  );
}

function IndexRows({
  items,
  order,
  edit,
  remove,
  move,
}: {
  items: CustomListSummary[];
  order: { offset: number; total: number; pending: boolean; enabled: boolean };
  edit: (item: CustomListSummary) => void;
  remove: (item: CustomListSummary) => void;
  move: (item: CustomListSummary, position: number) => void;
}) {
  return (
    <>
      {items.map((item, index) => (
        <View key={item.id} className="gap-2">
          <ListCard
            item={item}
            blocked={order.pending}
            edit={() => edit(item)}
            remove={() => remove(item)}
          />
          {order.enabled ? (
            <ListMoveControls
              name={item.name}
              position={order.offset + index}
              total={order.total}
              pending={order.pending}
              move={(position) => move(item, position)}
            />
          ) : null}
        </View>
      ))}
    </>
  );
}
