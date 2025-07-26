'use client';

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
import {
  addToList,
  createList,
  getUserListsWithStatus,
  removeFromList,
  UserListsWithStatus,
} from '@/lib/lists';
import { Check, List, ListPlus } from 'lucide-react';
import { ChangeEvent, useState, useTransition } from 'react';
import { toast } from 'sonner';

interface ListButtonProps {
  mediaId: number;
  mediaType: 'movie' | 'tv' | 'person';
  userId?: string;
}

export function ListButton({ mediaId, mediaType, userId }: ListButtonProps) {
  const [lists, setLists] = useState<UserListsWithStatus>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('📝');
  const [isPending, startTransition] = useTransition();

  if (!userId) {
    return null;
  }

  async function refreshLists() {
    try {
      const userLists = await getUserListsWithStatus(mediaId, mediaType);
      setLists(userLists);
    } catch (error) {
      console.error('Failed to fetch lists:', error);
    }
  }

  async function handleToggleList(listId: string, hasItem: boolean) {
    const list = lists.find((l) => l.id === listId);
    const listName = list?.name || 'list';

    startTransition(async () => {
      try {
        if (hasItem) {
          await removeFromList(listId, mediaId, mediaType);
          toast.success(`Removed from "${listName}"`);
        } else {
          await addToList(listId, mediaId, mediaType);
          toast.success(`Added to "${listName}"`);
        }
        await refreshLists(); // Refresh to update checkboxes
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : hasItem
              ? `Failed to remove from "${listName}"`
              : `Failed to add to "${listName}"`
        );
      }
    });
  }

  async function handleCreateList() {
    if (!newListName.trim()) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await createList(
        newListName.trim(),
        newListDescription.trim(),
        selectedEmoji
      );
      if (result.success) {
        await addToList(result.listId, mediaId, mediaType);
        setNewListName('');
        setNewListDescription('');
        setSelectedEmoji('📝');
        setIsCreateOpen(false);
        await refreshLists();
        toast.success('List created and item added');
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to create list'
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <DropdownMenu
        open={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open);
          if (open) {
            refreshLists();
          }
        }}
      >
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" disabled={isPending}>
            <List className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            {lists.length === 0 ? (
              <DropdownMenuItem disabled>No lists yet</DropdownMenuItem>
            ) : (
              lists.map((list) => (
                <DropdownMenuItem
                  key={list.id}
                  onSelect={() => handleToggleList(list.id, list.hasItem)}
                  disabled={isPending}
                  className="flex items-center justify-between"
                  title={
                    list.hasItem
                      ? `Remove from "${list.name}"`
                      : `Add to "${list.name}"`
                  }
                >
                  <span className="flex flex-1 items-center gap-2">
                    <span className="text-lg">{list.emoji}</span>
                    <span>{list.name}</span>
                  </span>
                  {list.hasItem && (
                    <Check className="ml-2 h-4 w-4 flex-shrink-0 text-green-500" />
                  )}
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => setIsCreateOpen(true)}
            disabled={isPending}
          >
            <ListPlus className="mr-2 h-4 w-4" />
            Create new list
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create new list</DialogTitle>
            <DialogDescription>
              Create a new list and add this item to it.
            </DialogDescription>
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
                      className={`hover:bg-muted rounded p-2 text-xl transition-colors ${
                        selectedEmoji === emoji
                          ? 'bg-primary text-primary-foreground'
                          : ''
                      }`}
                      disabled={isLoading}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                <p className="text-muted-foreground mt-1 text-sm">
                  Selected: {selectedEmoji}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={newListName}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setNewListName(e.target.value)
                }
                className="col-span-3"
                disabled={isLoading}
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
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleCreateList}
              disabled={isLoading || !newListName.trim()}
            >
              {isLoading ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
