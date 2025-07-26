'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { EMOJI_OPTIONS } from '@/lib/config';
import { createList } from '@/lib/lists';
import { ListPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

interface CreateListDialogProps {
  children?: React.ReactNode;
}

export function CreateListDialog({ children }: CreateListDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('📝');

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
        setNewListName('');
        setNewListDescription('');
        setSelectedEmoji('📝');
        setIsOpen(false);
        toast.success('List created successfully');
        router.refresh(); // Refresh the page to show the new list
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to create list'
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleOpenChange(open: boolean) {
    setIsOpen(open);
    if (!open) {
      setNewListName('');
      setNewListDescription('');
      setSelectedEmoji('📝');
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <ListPlus className="mr-2 h-4 w-4" />
            Create New List
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New List</DialogTitle>
          <DialogDescription>
            Create a new list to organize your favorite movies and TV shows.
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
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setNewListName(e.target.value)
              }
              className="col-span-3"
              disabled={isLoading}
              placeholder="e.g. Favorite Movies"
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
              placeholder="Optional description for your list"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={handleCreateList}
            disabled={isLoading || !newListName.trim()}
          >
            {isLoading ? 'Creating...' : 'Create List'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
