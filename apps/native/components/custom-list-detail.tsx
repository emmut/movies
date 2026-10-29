import {
  customListIdInput,
  type CustomListDetail,
  type CustomListEntry,
  type CustomListSummary,
} from '@movies/api/custom-lists';
import type { RegionCode } from '@movies/config/regions';
import { AccountScreen } from '@native/components/account-screen';
import { CustomListDialogs } from '@native/components/custom-list-dialogs';
import { CustomListScroll } from '@native/components/custom-list-scroll';
import { ListMoveControls, ListPageControls } from '@native/components/list-controls';
import { MediaPoster } from '@native/components/media-poster';
import { PersonCredit } from '@native/components/person-credits';
import { ScreenQueryState } from '@native/components/screen-query-state';
import { SystemListFilters } from '@native/components/system-list-filters';
import { accountQueryKey } from '@native/lib/account-query-key';
import { orpc } from '@native/lib/api';
import { refreshCustomLists } from '@native/lib/custom-lists';
import { readListPageState, canReorderList } from '@native/lib/list-page-state';
import { accountRegionQueryOptions } from '@native/lib/preferences';
import { scalar } from '@native/lib/search-params';
import { useCanonicalListPage } from '@native/lib/use-canonical-list-page';
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

function NotFound() {
  return (
    <View className="gap-4 p-5">
      <Text accessibilityRole="header" className="text-xl font-bold text-foreground">
        List not found
      </Text>
      <Text className="text-muted">This list is unavailable to your account.</Text>
      <Link href="/more/lists" className="text-foreground">
        Back to My Lists
      </Link>
    </View>
  );
}
function Entry({ item, region }: { item: CustomListEntry; region: string }) {
  if (item.type === 'person') {
    return (
      <PersonCredit
        person={{
          creditId: item.listItemId,
          id: item.id,
          name: item.title,
          profileUrl: item.posterUrl,
          role: 'Person',
        }}
        region={region}
        compact={false}
      />
    );
  }
  return <MediaPoster item={item} region={region} />;
}
function ListContents({
  result,
  input,
  userId,
  stale,
  change,
  retry,
}: {
  result: CustomListDetail;
  input: { listId: string; region: RegionCode; providerIds: number[]; page: number };
  userId: string;
  stale: boolean;
  change: (params: Record<string, string>) => void;
  retry: () => void;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<CustomListSummary | null>(null);
  const [deleting, setDeleting] = useState<CustomListSummary | null>(null);
  const [reordering, setReordering] = useState(false);
  const move = useMutation(
    orpc.customLists.moveItem.mutationOptions({ onSuccess: () => refreshCustomLists(userId) }),
  );
  const remove = useMutation(
    orpc.customLists.remove.mutationOptions({ onSuccess: () => refreshCustomLists(userId) }),
  );
  const busy = stale || move.isPending || remove.isPending;
  const reorderDisabled = !canReorderList(input, result, busy);
  const offset = (result.currentPage - 1) * result.itemsPerPage;
  return (
    <>
      <CustomListScroll memoryKey={'custom-list:' + userId + ':' + JSON.stringify(input)}>
        <DetailHeader
          result={result}
          busy={busy}
          edit={() => setEditing(result)}
          remove={() => setDeleting(result)}
        />
        <SystemListFilters input={input} userId={userId} change={change} />
        <Pressable
          accessibilityRole="button"
          disabled={reorderDisabled}
          accessibilityState={{ disabled: reorderDisabled }}
          className="bg-default min-h-12 justify-center self-start rounded-lg px-4"
          onPress={() => setReordering(!reordering)}
        >
          <Text className="text-foreground">{reordering ? 'Done reordering' : 'Reorder'}</Text>
        </Pressable>
        {move.isError || remove.isError ? (
          <Text accessibilityRole="alert" className="text-red-600 dark:text-red-400">
            Couldn’t update your list. Please try again.
          </Text>
        ) : null}
        {result.unavailableItems > 0 ? (
          <View className="gap-2">
            <Text className="text-muted">
              {result.unavailableItems} saved titles couldn’t load.
            </Text>
            <Pressable
              accessibilityRole="button"
              className="bg-default min-h-12 justify-center self-start rounded-lg px-4"
              onPress={retry}
            >
              <Text className="text-foreground">Retry saved titles</Text>
            </Pressable>
          </View>
        ) : null}
        <ListEntries
          items={result.items}
          region={input.region}
          order={{
            offset,
            total: result.totalItems,
            pending: busy,
            enabled: reordering && !reorderDisabled,
          }}
          remove={(item) =>
            remove.mutate({ listId: result.id, resourceId: item.id, resourceType: item.type })
          }
          move={(item, position) => move.mutate({ itemId: item.listItemId, position })}
        />
        <DetailEmpty total={result.totalItems} filtered={input.providerIds.length > 0} />
        <ListPageControls
          page={result.currentPage}
          pages={result.totalPages}
          blocked={busy}
          change={(page) => change({ page: String(page) })}
        />
      </CustomListScroll>
      <CustomListDialogs
        userId={userId}
        editor={editing}
        deleting={deleting}
        closeEditor={() => setEditing(null)}
        closeDelete={() => setDeleting(null)}
        deleted={() => router.replace('/more/lists')}
      />
    </>
  );
}
function DetailQuery({
  listId,
  userId,
  region,
}: {
  listId: string;
  userId: string;
  region: string;
}) {
  const params = useLocalSearchParams();
  const router = useRouter();
  const input = { listId, ...readListPageState(params, region) };
  const query = useQuery({
    ...orpc.customLists.details.queryOptions({ input, retry: false }),
    queryKey: accountQueryKey(orpc.customLists.details.queryKey({ input }), userId),
    placeholderData: keepPreviousData,
  });
  useCanonicalListPage(query, input.page);
  if (query.error && 'code' in query.error && query.error.code === 'NOT_FOUND') {
    return <NotFound />;
  }
  if (!query.data || query.isError) {
    return (
      <ScreenQueryState
        label="your list"
        failed={query.isError}
        retry={() => {
          void query.refetch();
        }}
      />
    );
  }
  return (
    <ListContents
      key={listId}
      result={query.data}
      input={input}
      userId={userId}
      stale={query.isFetching}
      change={(values) => router.setParams(values)}
      retry={() => {
        void query.refetch();
      }}
    />
  );
}
function RegionalDetail({ userId }: { userId: string }) {
  const params = useLocalSearchParams();
  const region = useQuery(accountRegionQueryOptions(userId, { retry: false }));
  const id = customListIdInput.safeParse({ listId: scalar(params.listId) });
  if (!id.success) {
    return <NotFound />;
  }
  if (!region.data) {
    return (
      <ScreenQueryState
        label="your region"
        failed={region.isError}
        retry={() => {
          void region.refetch();
        }}
      />
    );
  }
  return (
    <DetailQuery
      key={id.data.listId}
      listId={id.data.listId}
      userId={userId}
      region={region.data.region}
    />
  );
}
export function CustomListDetailScreen() {
  return <AccountScreen>{(userId) => <RegionalDetail userId={userId} />}</AccountScreen>;
}

function DetailHeader({
  result,
  busy,
  edit,
  remove,
}: {
  result: CustomListDetail;
  busy: boolean;
  edit: () => void;
  remove: () => void;
}) {
  return (
    <View className="gap-3">
      <Text className="text-4xl">{result.emoji}</Text>
      <Text accessibilityRole="header" className="text-3xl font-bold text-foreground">
        {result.name}
      </Text>
      {result.description ? <Text className="text-muted">{result.description}</Text> : null}
      <Text className="text-muted">
        {result.itemCount} {result.itemCount === 1 ? 'item' : 'items'}
      </Text>
      <View className="flex-row gap-3">
        <Pressable
          accessibilityRole="button"
          disabled={busy}
          className="bg-default min-h-12 justify-center rounded-lg px-4"
          onPress={edit}
        >
          <Text className="text-foreground">Edit List</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          disabled={busy}
          className="bg-default min-h-12 justify-center rounded-lg px-4"
          onPress={remove}
        >
          <Text className="text-foreground">Delete List</Text>
        </Pressable>
      </View>
    </View>
  );
}
function ListEntries({
  items,
  region,
  order,
  remove,
  move,
}: {
  items: CustomListEntry[];
  region: string;
  order: { offset: number; total: number; pending: boolean; enabled: boolean };
  remove: (item: CustomListEntry) => void;
  move: (item: CustomListEntry, position: number) => void;
}) {
  return (
    <View className="flex-row flex-wrap gap-y-5">
      {items.map((item, index) => (
        <View key={item.listItemId} className="w-1/2 items-center gap-2">
          <Entry item={item} region={region} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={'Remove ' + item.title + ' from list'}
            disabled={order.pending}
            className="bg-default min-h-12 justify-center rounded-lg px-3"
            onPress={() => remove(item)}
          >
            <Text className="text-foreground">Remove</Text>
          </Pressable>
          {order.enabled ? (
            <ListMoveControls
              name={item.title}
              position={order.offset + index}
              total={order.total}
              pending={order.pending}
              move={(position) => move(item, position)}
            />
          ) : null}
        </View>
      ))}
    </View>
  );
}
function DetailEmpty({ total, filtered }: { total: number; filtered: boolean }) {
  if (total > 0) {
    return null;
  }
  return (
    <View className="items-center gap-3 py-8">
      <Text
        accessibilityRole="header"
        className="text-center text-xl font-semibold text-foreground"
      >
        {filtered ? 'No titles match your providers' : 'This list is empty'}
      </Text>
      <Text className="text-center text-muted">
        Save movies, TV shows and people using Add to Lists on their pages.
      </Text>
      <Link href="/discover" asChild>
        <Pressable className="bg-default min-h-12 justify-center rounded-lg px-4">
          <Text className="text-foreground">Explore Movies &amp; TV Shows</Text>
        </Pressable>
      </Link>
    </View>
  );
}
