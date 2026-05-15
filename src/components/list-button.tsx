'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, List, ListPlus, Star } from 'lucide-react';
import { ChangeEvent, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { EMOJI_OPTIONS } from '@/lib/config';
import { addToList, createList, getUserListsWithStatus, removeFromList } from '@/lib/lists';
import { queryKeys } from '@/lib/query-keys';
import { isResourceInWatchlist } from '@/lib/watchlist';
import { toggleWatchlist } from '@/lib/watchlist-actions';

interface ListButtonProps {
  mediaId: number;
  mediaType: 'movie' | 'tv' | 'person';
  userId?: string;
  showWatchlist?: boolean;
}

export function ListButton({ mediaId, mediaType, userId, showWatchlist = true }: ListButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('📝');
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

  if (!userId) {
    return null;
  }

  async function handleToggleList(listId: string, hasItem: boolean) {
    const list = lists.find((l) => l.id === listId);
    const listName = list?.name || 'list';
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
        predicate: (query) => {
          const [, , queryListId] = query.queryKey;
          return queryListId === listId;
        },
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.lists.withStatus(mediaId, mediaType) });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : hasItem
            ? `Failed to remove from "${listName}"`
            : `Failed to add to "${listName}"`,
      );
    } finally {
      setIsPending(false);
    }
  }

  async function handleCreateList() {
    if (!newListName.trim()) {
      toast.error('List name is required');
      return;
    }

    setIsLoading(true);
    try {
      const result = await createList(newListName.trim(), newListDescription.trim(), selectedEmoji);
      if (result.success) {
        await addToList(result.listId, mediaId, mediaType);
        setNewListName('');
        setNewListDescription('');
        setSelectedEmoji('📝');
        setIsCreateOpen(false);
        queryClient.invalidateQueries({ queryKey: queryKeys.lists.withStatus(mediaId, mediaType) });
        toast.success('List created and item added');
      }
    } catch (error) {
      let errorMessage = 'Failed to create list';
      if (error instanceof Error) {
        if (
          error.message.includes('List name') ||
          error.message.includes('Description') ||
          error.message.includes('emoji')
        ) {
          errorMessage = error.message.includes('emoji')
            ? 'Invalid emoji selection'
            : error.message;
        } else {
          errorMessage = error.message;
        }
      }
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleToggleWatchlist() {
    const previous =
      queryClient.getQueryData<boolean>(queryKeys.watchlist.status(mediaId, mediaType)) ?? false;
    queryClient.setQueryData(queryKeys.watchlist.status(mediaId, mediaType), !previous);
    setIsPending(true);
    try {
      const result = await toggleWatchlist({ resourceId: mediaId, resourceType: mediaType });
      queryClient.setQueryData(
        queryKeys.watchlist.status(mediaId, mediaType),
        result.action === 'added',
      );
      toast.success(result.action === 'added' ? 'Added to watchlist' : 'Removed from watchlist');
      queryClient.invalidateQueries({ queryKey: queryKeys.watchlist.all });
    } catch (error) {
      queryClient.setQueryData(queryKeys.watchlist.status(mediaId, mediaType), previous);
      toast.error(error instanceof Error ? error.message : 'Failed to update watchlist');
    } finally {
      setIsPending(false);
    }
  }

  return (
    <>
      <DropdownMenu
        open={isOpen}
        onOpenChange={setIsOpen}
      >
        <DropdownMenuTrigger render={<Button variant="glass" size="icon" disabled={isPending} />}>
          <List className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-52">
          {showWatchlist && (
            <>
              <DropdownMenuItem
                onClick={handleToggleWatchlist}
                disabled={isPending}
                className="flex items-center justify-between"
                title={isInWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
              >
                <span className="flex flex-1 items-center gap-2">
                  <Star className={`h-4 w-4 ${isInWatchlist ? 'fill-current' : ''}`} />
                  <span>{isInWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}</span>
                </span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          <DropdownMenuGroup>
            {isLoadingLists ? (
              <DropdownMenuItem disabled className="py-2.5">
                Loading lists...
              </DropdownMenuItem>
            ) : lists.length === 0 ? (
              <DropdownMenuItem disabled className="py-2.5">
                No lists yet
              </DropdownMenuItem>
            ) : (
              lists.map((list) => (
                <DropdownMenuItem
                  key={list.id}
                  onClick={() => handleToggleList(list.id, list.hasItem)}
                  disabled={isPending}
                  className="flex items-center justify-between"
                  title={list.hasItem ? `Remove from "${list.name}"` : `Add to "${list.name}"`}
                >
                  <span className="flex flex-1 items-center gap-2">
                    <span className="text-lg">{list.emoji}</span>
                    <span>{list.name}</span>
                  </span>
                  {list.hasItem && <Check className="ml-2 h-4 w-4 shrink-0 text-green-500" />}
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setIsCreateOpen(true)} disabled={isPending}>
            <ListPlus className="mr-2 h-4 w-4" />
            Create new list
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create new list</DialogTitle>
            <DialogDescription>Create a new list and add this item to it.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="emoji" className="text-right">
                Emoji
              </Label>
              <div className="col-span-3">
                <div className="grid max-h-32 grid-cols-6 gap-2 overflow-y-auto rounded-md border p-2">
                  {EMOJI_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setSelectedEmoji(emoji)}
                      className={`rounded p-2 text-xl transition-colors hover:bg-muted ${
                        selectedEmoji === emoji ? 'bg-primary text-primary-foreground' : ''
                      }`}
                      disabled={isLoading}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">Selected: {selectedEmoji}</p>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={newListName}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setNewListName(e.target.value)}
                className="col-span-3"
                disabled={isLoading}
                maxLength={100}
                placeholder="Enter list name..."
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                value={newListDescription}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                  setNewListDescription(e.target.value)
                }
                className="col-span-3"
                disabled={isLoading}
                maxLength={500}
                placeholder="Optional description..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreateList} disabled={isLoading || !newListName.trim()}>
              {isLoading ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
