
import { useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { useRouter } from '@tanstack/react-router';
import { MouseEvent, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@movies/ui/components/button';
import { removeFromList } from '@movies/api/lib/lists';
import { queryKeys } from '@movies/api/lib/query-keys';

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
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to remove from list');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button
      variant="destructive"
      size="icon"
      className={className}
      onClick={handleRemove}
      disabled={isLoading}
      aria-label="Remove from list"
    >
      <X className="h-4 w-4" />
    </Button>
  );
}
