'use client';

import { type Query, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, List, ListPlus, Star } from 'lucide-react';
import { useState } from 'react';
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
import { isResourceInWatchlist } from '@/lib/watchlist';
import { toggleWatchlist } from '@/lib/watchlist-actions';

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

function WatchlistMenuItem({
  isInWatchlist,
  disabled,
  onToggle,
}: {
  isInWatchlist: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  const label = isInWatchlist ? 'Remove from watchlist' : 'Add to watchlist';
  return (
    <DropdownMenuItem
      onClick={onToggle}
      disabled={disabled}
      className="flex items-center justify-between"
      title={label}
    >
      <span className="flex flex-1 items-center gap-2">
        <Star className={`h-4 w-4 ${isInWatchlist ? 'fill-current' : ''}`} />
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

  const { data: isInWatchlist = false } = useQuery({
    queryKey: queryKeys.watchlist.status(mediaId, mediaType),
    queryFn: () => isResourceInWatchlist(mediaId, mediaType),
    staleTime: 30_000,
    enabled: isOpen && showWatchlist,
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

  async function handleToggleWatchlist() {
    const previous =
      queryClient.getQueryData<boolean>(queryKeys.watchlist.status(mediaId, mediaType)) ?? false;
    queryClient.setQueryData(queryKeys.watchlist.status(mediaId, mediaType), !previous);
    setIsPending(true);
    try {
      const result = await toggleWatchlist({ resourceId: mediaId, resourceType: mediaType });
      // 'added' and 'unchanged' both mean the row is present (the latter when a
      // concurrent insert won the race); only 'removed' clears it. From the
      // user's view the end state is identical, so both show "Added".
      const inWatchlist = result.action !== 'removed';
      queryClient.setQueryData(queryKeys.watchlist.status(mediaId, mediaType), inWatchlist);
      toast.success(inWatchlist ? 'Added to watchlist' : 'Removed from watchlist');
      queryClient.invalidateQueries({ queryKey: queryKeys.watchlist.all });
    } catch (error) {
      queryClient.setQueryData(queryKeys.watchlist.status(mediaId, mediaType), previous);
      toast.error(getErrorMessage(error, 'Failed to update watchlist'));
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
              <WatchlistMenuItem
                isInWatchlist={isInWatchlist}
                disabled={isPending}
                onToggle={handleToggleWatchlist}
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
