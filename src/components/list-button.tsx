'use client';

import { type Query, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, CircleCheck, Eye, List, ListPlus, Star } from 'lucide-react';
import { ReactNode, useState } from 'react';
import { toast } from 'sonner';

import { CreateListDialog } from '@/components/create-list-dialog';
import { Button } from '@/components/ui/button';
import { useSession } from '@/lib/auth-client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  addToList,
  getUserListsWithStatus,
  removeFromList,
  type UserListsWithStatus,
} from '@/lib/lists';
import { queryKeys } from '@/lib/query-keys';
import { getErrorMessage } from '@/lib/utils';
import { toggleSystemListItem } from '@/lib/system-list-actions';
import { isResourceInSystemList } from '@/lib/system-list-queries';
import type { SystemListType } from '@/lib/validations';

interface ListButtonProps {
  mediaId: number;
  mediaType: 'movie' | 'tv' | 'person';
  userId?: string;
  showWatchlist?: boolean;
}

type ListWithStatus = UserListsWithStatus[number];

function findListName(lists: UserListsWithStatus, listId: string) {
  return lists.find((list) => list.id === listId)?.name ?? 'list';
}

// list details query keys are shaped [..., ..., listId]; match by that slot.
function listDetailsPredicate(listId: string) {
  return (query: Query) => query.queryKey[2] === listId;
}

const SYSTEM_LIST_MENU_COPY: Record<
  SystemListType,
  {
    activeIcon: ReactNode;
    inactiveIcon: ReactNode;
    activeLabel: string;
    inactiveLabel: string;
    addedToast: string;
    removedToast: string;
    errorToast: string;
  }
> = {
  watchlist: {
    activeIcon: <Star className="h-4 w-4 fill-current" />,
    inactiveIcon: <Star className="h-4 w-4" />,
    activeLabel: 'Remove from watchlist',
    inactiveLabel: 'Add to watchlist',
    addedToast: 'Added to watchlist',
    removedToast: 'Removed from watchlist',
    errorToast: 'Failed to update watchlist',
  },
  watched: {
    activeIcon: <CircleCheck className="h-4 w-4" />,
    inactiveIcon: <Eye className="h-4 w-4" />,
    activeLabel: 'Mark as not watched',
    inactiveLabel: 'Mark as watched',
    addedToast: 'Marked as watched',
    removedToast: 'Removed from watched',
    errorToast: 'Failed to update watched',
  },
};

function SystemListMenuItem({
  listType,
  isActive,
  disabled,
  onToggle,
}: {
  listType: SystemListType;
  isActive: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  const copy = SYSTEM_LIST_MENU_COPY[listType];
  const label = isActive ? copy.activeLabel : copy.inactiveLabel;
  return (
    <DropdownMenuItem
      onClick={onToggle}
      disabled={disabled}
      className="flex items-center justify-between"
      title={label}
    >
      <span className="flex flex-1 items-center gap-2">
        {isActive ? copy.activeIcon : copy.inactiveIcon}
        <span>{label}</span>
      </span>
    </DropdownMenuItem>
  );
}

function ListMenuItem({
  list,
  disabled,
  onToggle,
}: {
  list: ListWithStatus;
  disabled: boolean;
  onToggle: (listId: string, hasItem: boolean) => void;
}) {
  const title = list.hasItem ? `Remove from "${list.name}"` : `Add to "${list.name}"`;
  return (
    <DropdownMenuItem
      onClick={() => onToggle(list.id, list.hasItem)}
      disabled={disabled}
      className="flex items-center justify-between"
      title={title}
    >
      <span className="flex flex-1 items-center gap-2">
        <span className="text-lg">{list.emoji}</span>
        <span>{list.name}</span>
      </span>
      {list.hasItem && <Check className="ml-2 h-4 w-4 shrink-0 text-green-500" />}
    </DropdownMenuItem>
  );
}

function ListMenuItems({
  lists,
  isLoading,
  disabled,
  onToggle,
}: {
  lists: UserListsWithStatus;
  isLoading: boolean;
  disabled: boolean;
  onToggle: (listId: string, hasItem: boolean) => void;
}) {
  if (isLoading) {
    return (
      <DropdownMenuItem disabled className="py-2.5">
        Loading lists...
      </DropdownMenuItem>
    );
  }
  if (lists.length === 0) {
    return (
      <DropdownMenuItem disabled className="py-2.5">
        No lists yet
      </DropdownMenuItem>
    );
  }
  return lists.map((list) => (
    <ListMenuItem key={list.id} list={list} disabled={disabled} onToggle={onToggle} />
  ));
}

function useSystemListStatus(
  listType: SystemListType,
  mediaId: number,
  mediaType: string,
  { enabled }: { enabled: boolean },
) {
  const { data = false } = useQuery({
    queryKey: queryKeys[listType].status(mediaId, mediaType),
    queryFn: () => isResourceInSystemList(listType, mediaId, mediaType),
    staleTime: 30_000,
    enabled,
  });
  return data;
}

function ListButtonInner({
  mediaId,
  mediaType,
  showWatchlist = true,
}: Omit<ListButtonProps, 'userId'>) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const queryClient = useQueryClient();

  const { data: lists = [], isLoading: isLoadingLists } = useQuery({
    queryKey: queryKeys.lists.withStatus(mediaId, mediaType),
    queryFn: () => getUserListsWithStatus(mediaId, mediaType),
    staleTime: 30_000,
    enabled: isOpen,
  });

  const systemItemsEnabled = isOpen && showWatchlist;
  const isInWatchlist = useSystemListStatus('watchlist', mediaId, mediaType, {
    enabled: systemItemsEnabled,
  });
  const isWatched = useSystemListStatus('watched', mediaId, mediaType, {
    enabled: systemItemsEnabled,
  });


  async function handleToggleList(listId: string, hasItem: boolean) {
    const listName = findListName(lists, listId);
    setIsPending(true);
    try {
      if (hasItem) {
        await removeFromList(listId, mediaId, mediaType);
        toast.success(`Removed from "${listName}"`);
      } else {
        await addToList(listId, mediaId, mediaType);
        toast.success(`Added to "${listName}"`);
      }
      queryClient.invalidateQueries({
        queryKey: queryKeys.lists.details(),
        predicate: listDetailsPredicate(listId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.lists.withStatus(mediaId, mediaType) });
    } catch (error) {
      toast.error(getErrorMessage(error, `Couldn't update "${listName}"`));
    } finally {
      setIsPending(false);
    }
  }

  async function handleToggleSystemList(listType: SystemListType) {
    const copy = SYSTEM_LIST_MENU_COPY[listType];
    const statusKey = queryKeys[listType].status(mediaId, mediaType);
    const previous = queryClient.getQueryData<boolean>(statusKey) ?? false;
    queryClient.setQueryData(statusKey, !previous);
    setIsPending(true);
    try {
      const result = await toggleSystemListItem({
        listType,
        resourceId: mediaId,
        resourceType: mediaType,
      });
      // 'added' and 'unchanged' both mean the row is present (the latter when a
      // concurrent insert won the race); only 'removed' clears it. From the
      // user's view the end state is identical, so both show "Added".
      const isInList = result.action !== 'removed';
      queryClient.setQueryData(statusKey, isInList);
      toast.success(isInList ? copy.addedToast : copy.removedToast);
      queryClient.invalidateQueries({ queryKey: queryKeys[listType].all });
    } catch (error) {
      queryClient.setQueryData(statusKey, previous);
      toast.error(getErrorMessage(error, copy.errorToast));
    } finally {
      setIsPending(false);
    }
  }

  async function handleListCreated(listId: string) {
    await addToList(listId, mediaId, mediaType);
    queryClient.invalidateQueries({ queryKey: queryKeys.lists.withStatus(mediaId, mediaType) });
  }

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger
          render={
            <Button
              variant="glass"
              size="icon"
              disabled={isPending}
              aria-label={showWatchlist ? 'Add to list or watchlist' : 'Add to list'}
            />
          }
        >
          <List className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-52">
          {showWatchlist && (
            <>
              <SystemListMenuItem
                listType="watchlist"
                isActive={isInWatchlist}
                disabled={isPending}
                onToggle={() => handleToggleSystemList('watchlist')}
              />
              <SystemListMenuItem
                listType="watched"
                isActive={isWatched}
                disabled={isPending}
                onToggle={() => handleToggleSystemList('watched')}
              />
              <DropdownMenuSeparator />
            </>
          )}

          <DropdownMenuGroup>
            <ListMenuItems
              lists={lists}
              isLoading={isLoadingLists}
              disabled={isPending}
              onToggle={handleToggleList}
            />
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setIsCreateOpen(true)} disabled={isPending}>
            <ListPlus className="mr-2 h-4 w-4" />
            Create new list
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateListDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onCreated={handleListCreated}
        successMessage="List created and item added"
      />
    </>
  );
}

// Fallback for cards rendered from prerendered (cached) lists that have no
// server-provided userId: resolve the signed-in user from the client session.
// Only this path subscribes to the session, so server-id callers stay cheap.
function SessionListButton(props: Omit<ListButtonProps, 'userId'>) {
  const { data: session } = useSession();

  if (!session?.user?.id) {
    return null;
  }

  return <ListButtonInner {...props} />;
}

export function ListButton({ userId, ...props }: ListButtonProps) {
  if (userId) {
    return <ListButtonInner {...props} />;
  }

  return <SessionListButton {...props} />;
}
