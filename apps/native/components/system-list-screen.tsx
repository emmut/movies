import {
  SYSTEM_LIST_COPY,
  SYSTEM_LIST_MEDIA,
  type SystemListCopy,
} from '@movies/api/system-list-copy';
import type { SystemListPage, SystemListPageInput } from '@movies/api/system-lists';
import type { SystemListType } from '@movies/api/validations';
import { BottomNavigation } from '@native/components/bottom-navigation';
import { MediaPoster } from '@native/components/media-poster';
import { ScreenQueryState } from '@native/components/screen-query-state';
import { ScrollNavigationProvider } from '@native/components/scroll-navigation';
import { SystemListFilters } from '@native/components/system-list-filters';
import { accountQueryKey } from '@native/lib/account-query-key';
import { orpc, queryClient } from '@native/lib/api';
import { authClient } from '@native/lib/auth-client';
import { accountRegionQueryOptions } from '@native/lib/preferences';
import { readSystemListState, canReorderSystemList } from '@native/lib/system-list-state';
import { useCurrentUrl } from '@native/lib/use-current-url';
import { useRememberedScroll } from '@native/lib/use-remembered-scroll';
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView as NativeSafeAreaView } from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';

const SafeAreaView = withUniwind(NativeSafeAreaView);
type Entry = SystemListPage['items'][number];
function title(listType: SystemListType) {
  return SYSTEM_LIST_COPY[listType].title;
}
function itemKey(item: Entry) {
  return item.listItemId;
}

function ListEmpty({
  input,
  result,
  retry,
}: {
  input: SystemListPageInput;
  result: SystemListPage;
  retry: () => void;
}) {
  if (result.unavailableItems > 0) {
    return (
      <View className="gap-3 p-5">
        <Text className="text-foreground">Some titles couldn’t load.</Text>
        <Pressable accessibilityRole="button" className="min-h-12 justify-center" onPress={retry}>
          <Text className="text-foreground">Try again</Text>
        </Pressable>
      </View>
    );
  }
  if (input.providerIds.length > 0) {
    return <Text className="p-5 text-center text-muted">No titles match your providers.</Text>;
  }
  return <EmptyListCopy input={input} total={result.counts.movie + result.counts.tv} />;
}

function emptyHint(copy: SystemListCopy, media: string, total: number) {
  if (total === 0) {
    return copy.emptyHintAll(media, 'tapping');
  }
  return copy.emptyHintMedia(media);
}

function EmptyListCopy({ input, total }: { input: SystemListPageInput; total: number }) {
  const router = useRouter();
  const copy = SYSTEM_LIST_COPY[input.listType];
  const media = SYSTEM_LIST_MEDIA[input.resourceType];
  const message = total === 0 ? copy.emptyTitleAll : copy.emptyTitleMedia(media.label);
  const hint = emptyHint(copy, media.label, total);
  return (
    <View className="items-center gap-3 p-5">
      <Text accessibilityRole="header" className="text-xl font-semibold text-foreground">
        {message}
      </Text>
      <Text className="text-center text-muted">{hint}</Text>
      <Pressable
        accessibilityRole="link"
        className="bg-default min-h-12 justify-center rounded-lg px-4"
        onPress={() =>
          router.navigate({ pathname: '/discover', params: { mediaType: input.resourceType } })
        }
      >
        <Text className="text-foreground">{media.exploreLabel}</Text>
      </Pressable>
    </View>
  );
}

function ListHeader({
  input,
  result,
  children,
}: {
  input: SystemListPageInput;
  result: SystemListPage;
  children: ReactNode;
}) {
  const router = useRouter();
  return (
    <View className="gap-3 p-5">
      <Text accessibilityRole="header" className="text-3xl font-bold text-foreground">
        {title(input.listType)}
      </Text>
      <Text className="text-muted">{listCountCaption(input, result)}</Text>
      <View className="flex-row gap-2">
        {(['movie', 'tv'] as const).map((type) => (
          <Pressable
            key={type}
            accessibilityRole="button"
            accessibilityLabel={SYSTEM_LIST_MEDIA[type].tabLabel}
            accessibilityState={{ selected: type === input.resourceType }}
            className="min-h-12 justify-center rounded-lg border border-border px-4"
            onPress={() => router.setParams({ mediaType: type, page: '1' })}
          >
            <Text className="text-foreground">{SYSTEM_LIST_MEDIA[type].tabLabel}</Text>
          </Pressable>
        ))}
      </View>
      {children}
    </View>
  );
}

function listCountCaption(input: SystemListPageInput, result: SystemListPage) {
  const count = result.counts[input.resourceType];
  const noun = SYSTEM_LIST_MEDIA[input.resourceType].countNoun;
  const plural = count === 1 ? '' : 's';
  const caption = count + ' ' + noun + plural + ' ' + SYSTEM_LIST_COPY[input.listType].countNoun;
  const total = result.counts.movie + result.counts.tv;
  if (total === 0) {
    return caption;
  }
  return caption + ' · Total: ' + total + ' items';
}

function PageControls({
  result,
  change,
  stale,
}: {
  result: SystemListPage;
  change: (params: Record<string, string>) => void;
  stale: boolean;
}) {
  const previousDisabled = stale || result.currentPage <= 1;
  const nextDisabled = stale || result.currentPage >= result.totalPages;
  return (
    <View className="items-center gap-3 p-5">
      <Text className="text-muted">
        Page {result.currentPage} of {Math.max(1, result.totalPages)}
      </Text>
      <View className="flex-row gap-4">
        <Pressable
          accessibilityRole="button"
          disabled={previousDisabled}
          accessibilityState={{ disabled: previousDisabled }}
          className="bg-default min-h-12 justify-center rounded-lg px-4"
          onPress={() => change({ page: String(result.currentPage - 1) })}
        >
          <Text className="text-foreground">Previous page</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          disabled={nextDisabled}
          accessibilityState={{ disabled: nextDisabled }}
          className="bg-default min-h-12 justify-center rounded-lg px-4"
          onPress={() => change({ page: String(result.currentPage + 1) })}
        >
          <Text className="text-foreground">Next page</Text>
        </Pressable>
      </View>
    </View>
  );
}

function MoveControls({
  item,
  index,
  total,
  pending,
  move,
}: {
  item: Entry;
  index: number;
  total: number;
  pending: boolean;
  move: (item: Entry, position: number) => void;
}) {
  const upDisabled = pending || index === 0;
  const downDisabled = pending || index >= total - 1;
  return (
    <View className="flex-row gap-2">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={'Move ' + item.title + ' up'}
        disabled={upDisabled}
        accessibilityState={{ disabled: upDisabled }}
        className="bg-default min-h-12 justify-center rounded-lg px-3"
        onPress={() => move(item, index - 1)}
      >
        <Text className="text-foreground">↑</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={'Move ' + item.title + ' down'}
        disabled={downDisabled}
        accessibilityState={{ disabled: downDisabled }}
        className="bg-default min-h-12 justify-center rounded-lg px-3"
        onPress={() => move(item, index + 1)}
      >
        <Text className="text-foreground">↓</Text>
      </Pressable>
    </View>
  );
}

function ListGrid({
  input,
  result,
  userId,
  change,
  retry,
  stale,
}: {
  input: SystemListPageInput;
  result: SystemListPage;
  userId: string;
  change: (params: Record<string, string>) => void;
  retry: () => void;
  stale: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const {
    ref,
    onScroll,
    onLayout,
    onContentSizeChange,
    onScrollBeginDrag,
    captureBeforeNavigation,
    cancelBeforeNavigation,
  } = useRememberedScroll<FlatList<Entry>>('system-list:' + userId + JSON.stringify(input));
  const move = useMutation(
    orpc.systemLists.move.mutationOptions({
      async onSuccess() {
        await queryClient.invalidateQueries({
          queryKey: accountQueryKey(orpc.systemLists.key(), userId),
        });
      },
    }),
  );
  const reorderDisabled = !canReorderSystemList(input, result, stale);
  const offset = (result.currentPage - 1) * result.itemsPerPage;
  return (
    <ScrollNavigationProvider capture={captureBeforeNavigation} cancel={cancelBeforeNavigation}>
      <FlatList
        testID="system-list-scroll"
        data={result.items}
        keyExtractor={itemKey}
        numColumns={2}
        className="flex-1"
        contentContainerClassName="gap-3 pb-12"
        contentInsetAdjustmentBehavior="automatic"
        ref={ref}
        onScroll={onScroll}
        onLayout={onLayout}
        onContentSizeChange={onContentSizeChange}
        onScrollBeginDrag={onScrollBeginDrag}
        onTouchMove={onScrollBeginDrag}
        scrollEventThrottle={16}
        ListHeaderComponent={
          <ListHeader input={input} result={result}>
            <SystemListFilters input={input} userId={userId} change={change} />
            <Pressable
              accessibilityRole="button"
              disabled={reorderDisabled}
              accessibilityState={{ disabled: reorderDisabled }}
              className="min-h-12 justify-center self-start rounded-lg border border-border px-4"
              onPress={() => setEditing(!editing)}
            >
              <Text className="text-foreground">{editing ? 'Done reordering' : 'Reorder'}</Text>
            </Pressable>
            {move.isError ? (
              <Text accessibilityRole="alert" className="text-red-500">
                Couldn’t reorder your list. Please try again.
              </Text>
            ) : null}
          </ListHeader>
        }
        renderItem={({ item, index }) => (
          <View className="flex-1 items-center gap-2 pb-4">
            <MediaPoster item={item} region={input.region} />
            {editing && !reorderDisabled ? (
              <MoveControls
                item={item}
                index={offset + index}
                total={result.totalItems}
                pending={move.isPending}
                move={(entry, position) =>
                  move.mutate({
                    listType: input.listType,
                    resourceType: input.resourceType,
                    itemId: entry.listItemId,
                    position,
                  })
                }
              />
            ) : null}
          </View>
        )}
        ListEmptyComponent={<ListEmpty input={input} result={result} retry={retry} />}
        ListFooterComponent={<PageControls result={result} change={change} stale={stale} />}
      />
    </ScrollNavigationProvider>
  );
}

function ListQuery({
  input,
  userId,
  change,
}: {
  input: SystemListPageInput;
  userId: string;
  change: (params: Record<string, string>) => void;
}) {
  const query = useQuery({
    ...orpc.systemLists.page.queryOptions({ input, retry: false }),
    placeholderData: keepPreviousData,
    queryKey: accountQueryKey(orpc.systemLists.page.queryKey({ input }), userId),
  });
  if (query.isPending || query.isError) {
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
    <ListGrid
      input={input}
      result={query.data}
      userId={userId}
      change={change}
      stale={query.isFetching}
      retry={() => {
        void query.refetch();
      }}
    />
  );
}

function RegionalList({ listType, userId }: { listType: SystemListType; userId: string }) {
  const region = useQuery(accountRegionQueryOptions(userId, { retry: false }));
  const params = useLocalSearchParams();
  const router = useRouter();
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
  const input = readSystemListState(params, listType, region.data.region);
  return <ListQuery input={input} userId={userId} change={(values) => router.setParams(values)} />;
}

function ListSession({ listType }: { listType: SystemListType }) {
  const session = authClient.useSession();
  const returnUrl = useCurrentUrl();
  if (session.isPending || session.error) {
    return (
      <ScreenQueryState
        label="your session"
        failed={Boolean(session.error)}
        retry={() => {
          void session.refetch();
        }}
      />
    );
  }
  if (!session.data) {
    return <Redirect href={{ pathname: '/login', params: { redirect_url: returnUrl } }} />;
  }
  return (
    <RegionalList key={session.data.user.id} listType={listType} userId={session.data.user.id} />
  );
}

export function SystemListScreen({ listType }: { listType: SystemListType }) {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['left', 'right']}>
      <ListSession listType={listType} />
      <BottomNavigation />
    </SafeAreaView>
  );
}
