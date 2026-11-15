'use client';

import { useCustomListsRemoveMutation } from '@movies/api/react/use-custom-lists-query';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@movies/ui/components/alert-dialog';
import { Button } from '@movies/ui/components/button';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { MouseEvent } from 'react';
import { toast } from 'sonner';

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
  const remove = useCustomListsRemoveMutation();
  const isLoading = remove.isPending;

  async function handleRemove(e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault(); // Prevent link navigation when clicking the button
    e.stopPropagation();

    try {
      await remove.mutateAsync({ listId, resourceId: mediaId, resourceType: mediaType });
      toast.success('Removed from list');

      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to remove from list');
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger
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
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove from list?</AlertDialogTitle>
          <AlertDialogDescription>
            This will remove the item from your list. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={handleRemove} disabled={isLoading}>
            Remove
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
