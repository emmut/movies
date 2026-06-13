'use client';

import { ListPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { ListFormDialog, type ListFormValues } from '@/components/list-form-dialog';
import { Button } from '@/components/ui/button';
import { createList } from '@/lib/lists';
import { getErrorMessage } from '@/lib/utils';

interface CreateListDialogProps {
  children?: React.ReactElement;
  /** Controlled open state. When provided, no internal trigger is rendered. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /**
   * Runs after a list is created successfully, before the success toast.
   * Use it to add the just-created list to a context (e.g. attach a media item)
   * or to invalidate caches. Receives the new list's id.
   */
  onCreated?: (listId: string) => void | Promise<void>;
  successMessage?: string;
}

export function CreateListDialog({
  children,
  open,
  onOpenChange,
  onCreated,
  successMessage = 'List created successfully',
}: CreateListDialogProps) {
  const router = useRouter();
  const isControlled = open !== undefined;

  async function handleSubmit(values: ListFormValues) {
    try {
      const result = await createList(values.name, values.description, values.emoji);
      if (!result.success) {
        return false;
      }
      await onCreated?.(result.listId);
      toast.success(successMessage);
      router.refresh();
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to create list'));
      return false;
    }
  }

  return (
    <ListFormDialog
      title="Create New List"
      description="Create a new list to organize your favorite movies and TV shows."
      initialValues={{ name: '', description: '', emoji: '📝' }}
      submitLabel="Create List"
      pendingLabel="Creating..."
      onSubmit={handleSubmit}
      open={open}
      onOpenChange={onOpenChange}
      trigger={
        isControlled
          ? undefined
          : children || (
              <Button>
                <ListPlus className="mr-2 h-4 w-4" />
                Create New List
              </Button>
            )
      }
    />
  );
}
