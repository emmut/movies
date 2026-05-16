
import { Edit } from 'lucide-react';
import { useRouter } from '@tanstack/react-router';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@movies/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@movies/ui/components/dialog';
import { Input } from '@movies/ui/components/input';
import { Label } from '@movies/ui/components/label';
import { Textarea } from '@movies/ui/components/textarea';
import { EMOJI_OPTIONS } from '@movies/api/lib/config';
import { updateList } from '@movies/api/lib/lists';

interface EditListDialogProps {
  listId: string;
  listName: string;
  listDescription: string | null;
  listEmoji: string;
  children?: React.ReactElement;
}

export function EditListDialog({
  listId,
  listName,
  listDescription,
  listEmoji,
  children,
}: EditListDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState(listName);
  const [description, setDescription] = useState(listDescription || '');
  const [selectedEmoji, setSelectedEmoji] = useState(listEmoji);

  async function handleUpdateList() {
    if (!name.trim()) {
      return;
    }

    setIsLoading(true);
    try {
      await updateList(listId, name.trim(), description.trim(), selectedEmoji);
      setIsOpen(false);
      toast.success('List updated successfully');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update list');
    } finally {
      setIsLoading(false);
    }
  }

  function handleOpenChange(open: boolean) {
    setIsOpen(open);
    if (!open) {
      // Reset to original values when closing
      setName(listName);
      setDescription(listDescription || '');
      setSelectedEmoji(listEmoji);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          children || (
            <Button variant="outline" size="sm">
              <Edit className="mr-2 h-4 w-4" />
              Edit List
            </Button>
          )
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit List</DialogTitle>
          <DialogDescription>Update your list details, emoji, and description.</DialogDescription>
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
              value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
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
              value={description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setDescription(e.target.value)
              }
              className="col-span-3"
              disabled={isLoading}
              placeholder="Optional description for your list"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleUpdateList} disabled={isLoading || !name.trim()}>
            {isLoading ? 'Updating...' : 'Update List'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
