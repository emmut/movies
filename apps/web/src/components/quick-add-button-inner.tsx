'use client';

import type { CustomListStatus } from '@movies/api/custom-lists';
import { useApiAccountId } from '@movies/api/react';
import {
  useCustomListsStatus,
  useCustomListsAddMutation,
  useCustomListsRemoveMutation,
} from '@movies/api/react/use-custom-lists-query';
import {
  useSystemListsMemberships,
  useSystemListsToggleMutation,
} from '@movies/api/react/use-system-lists-query';
import { Button } from '@movies/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@movies/ui/components/dropdown-menu';
import { Check, CircleCheck, Eye, List, ListPlus, Star } from 'lucide-react';
import { ReactNode, useState } from 'react';
import { toast } from 'sonner';

import { CreateListDialog } from '@/components/create-list-dialog';
import { getErrorMessage } from '@/lib/utils';
import type { SystemListType } from '@/lib/validations';

export interface QuickAddButtonProps {
  mediaId: number;
  mediaType: 'movie' | 'tv' | 'person';
  userId?: string;
  showWatchlist?: boolean;
}

type ListWithStatus = CustomListStatus[number];

function findListName(lists: CustomListStatus, listId: string) {
  return lists.find((list) => list.id === listId)?.name ?? 'list';
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
  lists: CustomListStatus;
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

/** System lists only accept movie and TV resources. */
function toSystemResourceType(mediaType: QuickAddButtonProps['mediaType']) {
  return mediaType === 'tv' ? 'tv' : 'movie';
}

function useQuickAddActions(
  mediaId: number,
  mediaType: QuickAddButtonProps['mediaType'],
  lists: CustomListStatus,
) {
  const add = useCustomListsAddMutation();
  const remove = useCustomListsRemoveMutation();
  const toggle = useSystemListsToggleMutation();
  const isPending = add.isPending || remove.isPending || toggle.isPending;

  async function handleToggleList(listId: string, hasItem: boolean) {
    const listName = findListName(lists, listId);
    try {
      if (hasItem) {
        await remove.mutateAsync({ listId, resourceId: mediaId, resourceType: mediaType });
        toast.success(`Removed from "${listName}"`);
      } else {
        await add.mutateAsync({ listId, resourceId: mediaId, resourceType: mediaType });
        toast.success(`Added to "${listName}"`);
      }
    } catch (error) {
      toast.error(getErrorMessage(error, `Couldn't update "${listName}"`));
    }
  }

  async function handleToggleSystemList(listType: SystemListType) {
    const copy = SYSTEM_LIST_MENU_COPY[listType];
    try {
      const result = await toggle.mutateAsync({
        listType,
        resourceId: mediaId,
        resourceType: toSystemResourceType(mediaType),
      });
      // 'added' and 'unchanged' both mean the row is present (the latter when a
      // concurrent insert won the race); only 'removed' clears it. From the
      // user's view the end state is identical, so both show "Added".
      const isInList = result.action !== 'removed';
      toast.success(isInList ? copy.addedToast : copy.removedToast);
    } catch (error) {
      toast.error(getErrorMessage(error, copy.errorToast));
    }
  }

  async function handleListCreated(listId: string) {
    await add.mutateAsync({ listId, resourceId: mediaId, resourceType: mediaType });
  }

  return { isPending, handleToggleList, handleToggleSystemList, handleListCreated };
}

function useQuickAddState({
  mediaId,
  mediaType,
  showWatchlist = true,
}: Omit<QuickAddButtonProps, 'userId'>) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const accountId = useApiAccountId();
  const { data: lists = [], isLoading: isLoadingLists } = useCustomListsStatus(
    accountId ?? '',
    { resourceId: mediaId, resourceType: mediaType },
    isOpen && Boolean(accountId),
  );
  const { data: memberships } = useSystemListsMemberships(
    accountId,
    { resourceId: mediaId, resourceType: toSystemResourceType(mediaType) },
    isOpen && showWatchlist && mediaType !== 'person',
  );
  const { inWatchlist: isInWatchlist, watched: isWatched } = memberships ?? {
    inWatchlist: false,
    watched: false,
  };

  const actions = useQuickAddActions(mediaId, mediaType, lists);

  return {
    isOpen,
    setIsOpen,
    isCreateOpen,
    setIsCreateOpen,
    ...actions,
    lists,
    isLoadingLists,
    isInWatchlist,
    isWatched,
  };
}

export function QuickAddButtonInner({
  mediaId,
  mediaType,
  showWatchlist = true,
}: Omit<QuickAddButtonProps, 'userId'>) {
  const {
    isOpen,
    setIsOpen,
    isCreateOpen,
    setIsCreateOpen,
    isPending,
    lists,
    isLoadingLists,
    isInWatchlist,
    isWatched,
    handleToggleList,
    handleToggleSystemList,
    handleListCreated,
  } = useQuickAddState({ mediaId, mediaType, showWatchlist });

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger
          render={
            <Button
              variant={showWatchlist ? 'glass' : 'outline'}
              className={
                showWatchlist
                  ? 'size-11 bg-transparent p-0 hover:bg-transparent md:size-10'
                  : 'size-11 gap-2 p-0 sm:h-10 sm:w-auto sm:px-3'
              }
              disabled={isPending}
              aria-label={showWatchlist ? 'Quick add' : 'Add to list'}
              title={showWatchlist ? 'Quick add' : 'Add to list'}
            />
          }
        >
          {showWatchlist ? (
            <span className="flex size-8 items-center justify-center rounded-lg bg-white/20 transition-colors group-hover/button:bg-white/30 group-aria-expanded/button:bg-white/30">
              <List className="size-4" aria-hidden="true" />
            </span>
          ) : (
            <>
              <List className="size-5 sm:size-4" aria-hidden="true" />
              <span className="hidden sm:inline">Add to list</span>
            </>
          )}
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
