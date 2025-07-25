'use client';

import { Button } from '@/components/ui/button';
import { removeFromList } from '@/lib/lists';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

interface RemoveFromListButtonProps {
  listId: string;
  mediaId: number;
  mediaType: 'movie' | 'tv';
  className?: string;
}

export function RemoveFromListButton({
  listId,
  mediaId,
  mediaType,
  className,
}: RemoveFromListButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleRemove = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent link navigation when clicking the button
    e.stopPropagation();

    setIsLoading(true);
    try {
      await removeFromList(listId, mediaId, mediaType);
      toast.success('Removed from list');
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to remove from list'
      );
    } finally {
      setIsLoading(false);
    }
  };

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
