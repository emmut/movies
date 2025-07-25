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
import { addToList, createList, getUserLists } from '@/lib/lists';
import { List, ListPlus } from 'lucide-react';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

interface ListButtonProps {
  mediaId: number;
  mediaType: 'movie' | 'tv';
  userId?: string;
}

export function ListButton({ mediaId, mediaType, userId }: ListButtonProps) {
  const [lists, setLists] = useState<Awaited<ReturnType<typeof getUserLists>>>(
    []
  );
  const [isOpen, setIsOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
  const [isPending, startTransition] = useTransition();

  if (!userId) {
    return null;
  }

  const refreshLists = async () => {
    try {
      const userLists = await getUserLists();
      setLists(userLists);
    } catch (error) {
      console.error('Failed to fetch lists:', error);
    }
  };

  const handleAddToList = async (listId: string) => {
    startTransition(async () => {
      try {
        await addToList(listId, mediaId, mediaType);
        toast.success('Added to list');
        setIsOpen(false);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Failed to add to list'
        );
      }
    });
  };

  const handleCreateList = async () => {
    if (!newListName.trim()) return;

    setIsLoading(true);
    try {
      const result = await createList(
        newListName.trim(),
        newListDescription.trim()
      );
      if (result.success) {
        await handleAddToList(result.listId);
        setNewListName('');
        setNewListDescription('');
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
  };

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
                  onSelect={() => handleAddToList(list.id)}
                  disabled={isPending}
                >
                  {list.name}
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
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={newListName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
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
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
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
