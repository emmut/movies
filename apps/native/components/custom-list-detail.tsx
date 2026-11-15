import {
  customListIdInput,
  type CustomListDetail,
  type CustomListEntry,
  type CustomListSummary,
} from '@movies/api/custom-lists';
import { hasErrorCode } from '@movies/api/errors';
import { canReorderList } from '@movies/api/list-order';
import {
  useCustomListsMoveItemMutation,
  useCustomListsRemoveMutation,
  useCustomListsDetails,
} from '@movies/api/react/use-custom-lists-query';
import { useAccountRegion } from '@movies/api/react/use-preferences-query';
import { AccountScreen } from '@native/components/account-screen';
import { CatalogPagination } from '@native/components/catalog-pagination';
import { CustomListDialogs } from '@native/components/custom-list-dialogs';
import { CustomListScroll } from '@native/components/custom-list-scroll';
import { ListMoveControls } from '@native/components/list-controls';
import { ListMutationError } from '@native/components/list-mutation-error';
import { MediaPoster } from '@native/components/media-poster';
import { PersonCredit } from '@native/components/person-credits';
import { ScreenQueryState } from '@native/components/screen-query-state';
import { SystemListFilters } from '@native/components/system-list-filters';
import { readListPageState } from '@native/lib/list-page-state';
import { scalar } from '@native/lib/search-params';
import { useCanonicalListPage } from '@native/lib/use-canonical-list-page';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

type ListFilters = ReturnType<typeof readListPageState>;
type ListDetailInput = ListFilters & { listId: string };

export function CustomListDetailScreen() {
  return <AccountScreen>{(userId) => <RegionalDetail userId={userId} />}</AccountScreen>;
}

function RegionalDetail({ userId }: { userId: string }) {
  const params = useLocalSearchParams();
  const region = useAccountRegion(userId);
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
  const query = useCustomListsDetails(userId, input);
  useCanonicalListPage(query, input.page);
  if (hasErrorCode(query.error, 'NOT_FOUND')) {
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
      list={query.data}
      input={input}
      userId={userId}
      isFetching={query.isFetching}
      change={(values) => router.setParams(values)}
      retry={() => {
        void query.refetch();
      }}
    />
  );
}

function ListContents({
  list,
  input,
  userId,
  isFetching,
  change,
  retry,
}: {
  list: CustomListDetail;
  input: ListDetailInput;
  userId: string;
  isFetching: boolean;
  change: (params: Record<string, string>) => void;
  retry: () => void;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<CustomListSummary | null>(null);
  const [deleting, setDeleting] = useState<CustomListSummary | null>(null);
  const moveMutation = useCustomListsMoveItemMutation({ accountId: userId });
  const removeMutation = useCustomListsRemoveMutation({ accountId: userId });
  const busy = isFetching || moveMutation.isPending || removeMutation.isPending;
  const hasMutationError = moveMutation.isError || removeMutation.isError;
  const scrollMemoryKey = `custom-list:${userId}:${JSON.stringify(input)}`;

  function removeEntry(item: CustomListEntry) {
    removeMutation.mutate({
      listId: list.id,
      resourceId: item.id,
      resourceType: item.type,
    });
  }

  function moveEntry(item: CustomListEntry, position: number) {
    moveMutation.mutate({ itemId: item.listItemId, position });
  }

  return (
    <>
      <CustomListScroll memoryKey={scrollMemoryKey}>
        <DetailHeader
          list={list}
          busy={busy}
          edit={() => setEditing(list)}
          remove={() => setDeleting(list)}
        />
        <SystemListFilters input={input} userId={userId} change={change} />
        <DetailNotices
          failed={hasMutationError}
          unavailable={list.unavailableItems}
          retry={retry}
        />
        <ReorderableEntries
          list={list}
          input={input}
          busy={busy}
          remove={removeEntry}
          move={moveEntry}
        />
        <DetailEmpty total={list.totalItems} filtered={input.providerIds.length > 0} />
        <CatalogPagination
          page={list.currentPage}
          totalPages={list.totalPages}
          disabled={busy}
          onChange={(page) => change({ page: String(page) })}
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

function DetailHeader({
  list,
  busy,
  edit,
  remove,
}: {
  list: CustomListDetail;
  busy: boolean;
  edit: () => void;
  remove: () => void;
}) {
  return (
    <View className="gap-3">
      <Text className="text-4xl">{list.emoji}</Text>
      <Text accessibilityRole="header" className="text-3xl font-bold text-foreground">
        {list.name}
      </Text>
      {list.description ? <Text className="text-muted">{list.description}</Text> : null}
      <Text className="text-muted">
        {list.itemCount} {list.itemCount === 1 ? 'item' : 'items'}
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

function DetailNotices({
  failed,
  unavailable,
  retry,
}: {
  failed: boolean;
  unavailable: number;
  retry: () => void;
}) {
  return (
    <>
      <ListMutationError failed={failed} />
      {unavailable > 0 ? (
        <View className="gap-2">
          <Text className="text-muted">{unavailable} saved titles couldn’t load.</Text>
          <Pressable
            accessibilityRole="button"
            className="bg-default min-h-12 justify-center self-start rounded-lg px-4"
            onPress={retry}
          >
            <Text className="text-foreground">Retry saved titles</Text>
          </Pressable>
        </View>
      ) : null}
    </>
  );
}
function ReorderableEntries({
  list,
  input,
  busy,
  remove,
  move,
}: {
  list: CustomListDetail;
  input: ListFilters;
  busy: boolean;
  remove: (item: CustomListEntry) => void;
  move: (item: CustomListEntry, position: number) => void;
}) {
  const [isReordering, setIsReordering] = useState(false);
  const canReorder = canReorderList(input, list, busy);
  const offset = (list.currentPage - 1) * list.itemsPerPage;
  const order = {
    offset,
    total: list.totalItems,
    pending: busy,
    enabled: isReordering && canReorder,
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        disabled={!canReorder}
        accessibilityState={{ disabled: !canReorder }}
        className="bg-default min-h-12 justify-center self-start rounded-lg px-4"
        onPress={() => setIsReordering(!isReordering)}
      >
        <Text className="text-foreground">{isReordering ? 'Done reordering' : 'Reorder'}</Text>
      </Pressable>
      <ListEntries
        items={list.items}
        region={input.region}
        order={order}
        remove={remove}
        move={move}
      />
    </>
  );
}
