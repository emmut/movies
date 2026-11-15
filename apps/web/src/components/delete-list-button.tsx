'use client';

import { useCustomListsDeleteMutation } from '@movies/api/react/use-custom-lists-query';
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
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface DeleteListButtonProps {
  listId: string;
  listName: string;
  itemCount: number;
  redirectAfterDelete?: boolean;
  children?: React.ReactElement;
}

export function DeleteListButton({
  listId,
  listName,
  itemCount,
  redirectAfterDelete = false,
  children,
}: DeleteListButtonProps) {
  const router = useRouter();
  const remove = useCustomListsDeleteMutation();
  const isLoading = remove.isPending;

  async function handleDelete() {
    try {
      await remove.mutateAsync({ listId });
      toast.success('List deleted successfully');

      router.refresh();
      if (redirectAfterDelete) {
        router.push('/lists');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete list');
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          children || (
            <Button variant="destructive" size="sm">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete List
            </Button>
          )
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete List</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete &quot;{listName}&quot;?
            <ListContentsWarning count={itemCount} /> This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isLoading} variant="destructive">
            {isLoading ? 'Deleting...' : 'Delete List'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function ListContentsWarning({ count }: { count: number }) {
  if (count === 0) {
    return null;
  }
  return (
    <>
      {' '}
      This list contains {count} {count === 1 ? 'item' : 'items'}.
    </>
  );
}
