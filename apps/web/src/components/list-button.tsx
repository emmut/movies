import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, List, ListPlus, Star } from 'lucide-react';
import { ChangeEvent, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@movies/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@movies/ui/components/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@movies/ui/components/dropdown-menu';
import { Input } from '@movies/ui/components/input';
import { Label } from '@movies/ui/components/label';
import { Textarea } from '@movies/ui/components/textarea';
import { EMOJI_OPTIONS } from '@movies/api/lib/config';
import { queryKeys } from '@movies/api/lib/query-keys';
import { orpc } from '@/utils/orpc';

interface ListButtonProps {
  mediaId: number;
  mediaType: 'movie' | 'tv' | 'person';
  userId?: string;
  showWatchlist?: boolean;
}

export function ListButton({ mediaId, mediaType, userId, showWatchlist = true }: ListButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('📝');
  const queryClient = useQueryClient();

  const { data: lists = [], isLoading: isLoadingLists } = useQuery(
    orpc.lists.withStatus.queryOptions({
      input: { mediaId, mediaType },
      enabled: isOpen,
      staleTime: 30_000,
    }),
  );

  const { data: isInWatchlist = false } = useQuery(
    orpc.watchlist.status.queryOptions({
      input: { resourceId: mediaId, resourceType: mediaType },
      enabled: isOpen && showWatchlist,
      staleTime: 30_000,
    }),
  );

  const addItem = useMutation(
    orpc.lists.addItem.mutationOptions({
      onSuccess: (_, vars) => {
        const list = lists.find((l) => l.id === vars.listId);
        toast.success(`Added to "${list?.name ?? 'list'}"`);
        queryClient.invalidateQueries({ queryKey: orpc.lists.withStatus.key() });
        queryClient.invalidateQueries({ queryKey: orpc.lists.detail.key() });
      },
      onError: (error) => toast.error(error instanceof Error ? error.message : 'Failed to add'),
    }),
  );

  const removeItem = useMutation(
    orpc.lists.removeItem.mutationOptions({
      onSuccess: (_, vars) => {
        const list = lists.find((l) => l.id === vars.listId);
        toast.success(`Removed from "${list?.name ?? 'list'}"`);
        queryClient.invalidateQueries({ queryKey: orpc.lists.withStatus.key() });
        queryClient.invalidateQueries({ queryKey: orpc.lists.detail.key() });
      },
      onError: (error) => toast.error(error instanceof Error ? error.message : 'Failed to remove'),
    }),
  );

  const createList = useMutation(
    orpc.lists.create.mutationOptions({
      onSuccess: async (result) => {
        addItem.mutate({ listId: result.listId, mediaId, mediaType });
        setNewListName('');
        setNewListDescription('');
        setSelectedEmoji('📝');
        setIsCreateOpen(false);
        queryClient.invalidateQueries({ queryKey: orpc.lists.withStatus.key() });
        toast.success('List created and item added');
      },
      onError: (error) => toast.error(error instanceof Error ? error.message : 'Failed to create list'),
    }),
  );

  const toggleWatchlistMutation = useMutation(
    orpc.watchlist.toggle.mutationOptions({
      onSuccess: (result) => {
        queryClient.setQueryData(
          orpc.watchlist.status.queryOptions({ input: { resourceId: mediaId, resourceType: mediaType } }).queryKey,
          result.action === 'added',
        );
        toast.success(result.action === 'added' ? 'Added to watchlist' : 'Removed from watchlist');
        queryClient.invalidateQueries({ queryKey: queryKeys.watchlist.all });
      },
      onError: (error) => toast.error(error instanceof Error ? error.message : 'Failed to update watchlist'),
    }),
  );

  if (!userId) {
    return null;
  }

  const isPending = addItem.isPending || removeItem.isPending || toggleWatchlistMutation.isPending;

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger render={<Button variant="outline" size="icon" disabled={isPending} />}>
          <List className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-52">
          {showWatchlist && (
            <>
              <DropdownMenuItem
                onClick={() => toggleWatchlistMutation.mutate({ resourceId: mediaId, resourceType: mediaType as 'movie' | 'tv' })}
                disabled={isPending}
                className="flex items-center justify-between"
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
                  onClick={() =>
                    list.hasItem
                      ? removeItem.mutate({ listId: list.id, mediaId, mediaType })
                      : addItem.mutate({ listId: list.id, mediaId, mediaType })
                  }
                  disabled={isPending}
                  className="flex items-center justify-between"
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
                      disabled={createList.isPending}
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
                disabled={createList.isPending}
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
                disabled={createList.isPending}
                maxLength={500}
                placeholder="Optional description..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() =>
                createList.mutate({
                  name: newListName.trim(),
                  description: newListDescription.trim(),
                  emoji: selectedEmoji,
                })
              }
              disabled={createList.isPending || !newListName.trim()}
            >
              {createList.isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
