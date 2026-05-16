import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { MouseEvent } from 'react';
import { toast } from 'sonner';

import { Button } from '@movies/ui/components/button';
import { queryKeys } from '@movies/api/lib/query-keys';
import { orpc } from '@/utils/orpc';

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
  const queryClient = useQueryClient();

  const removeItem = useMutation(
    orpc.lists.removeItem.mutationOptions({
      onSuccess: () => {
        toast.success('Removed from list');
        queryClient.invalidateQueries({ queryKey: queryKeys.lists.all });
      },
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : 'Failed to remove from list');
      },
    }),
  );

  function handleRemove(e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    removeItem.mutate({ listId, mediaId, mediaType });
  }

  return (
    <Button
      variant="destructive"
      size="icon"
      className={className}
      onClick={handleRemove}
      disabled={removeItem.isPending}
      aria-label="Remove from list"
    >
      <X className="h-4 w-4" />
    </Button>
  );
}
