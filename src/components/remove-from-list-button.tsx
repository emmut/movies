'use client';

import { useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { MouseEvent, useState } from 'react';
import { toast } from 'sonner';

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
import { removeFromList } from '@/lib/lists';
import { queryKeys } from '@/lib/query-keys';

interface RemoveFromListButtonProps {
  listId: string;
  mediaId: number;
  mediaType: 'movie' | 'tv' | 'person';
  className?: string;
}

export function RemoveFromListButton({
  listId,
  mediaId,
  mediaType,
  className,
}: RemoveFromListButtonProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  async function handleRemove(e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault(); // Prevent link navigation when clicking the button
    e.stopPropagation();

    setIsLoading(true);
    try {
      await removeFromList(listId, mediaId, mediaType);
      toast.success('Removed from list');

      // Invalidate all list queries to ensure fresh data on next navigation
      queryClient.invalidateQueries({
        queryKey: queryKeys.lists.all,
      });

      router.refresh();
      setIsOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to remove from list');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger
        render={
          <Button
            variant="destructive"
            size="icon"
            className={className}
            disabled={isLoading}
            aria-label="Remove from list"
          >
            <X className="h-4 w-4" />
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove from list?</DialogTitle>
          <DialogDescription>
            This will remove the item from your list. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleRemove} disabled={isLoading}>
            Remove
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
