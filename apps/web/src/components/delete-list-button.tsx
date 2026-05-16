
import { useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { useRouter } from '@tanstack/react-router';
import { useState } from 'react';
import { toast } from 'sonner';

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
import { deleteList } from '@movies/api/lib/lists';
import { queryKeys } from '@movies/api/lib/query-keys';

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
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  async function handleDelete() {
    setIsLoading(true);
    try {
      await deleteList(listId);
      toast.success('List deleted successfully');

      // Invalidate all list queries to ensure fresh data
      queryClient.invalidateQueries({
        queryKey: queryKeys.lists.all,
      });

      router.refresh();
      if (redirectAfterDelete) {
        router.push('/lists');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete list');
    } finally {
      setIsLoading(false);
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
            {itemCount > 0 &&
              ` This list contains ${itemCount} item${itemCount !== 1 ? 's' : ''}.`}{' '}
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? 'Deleting...' : 'Delete List'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
