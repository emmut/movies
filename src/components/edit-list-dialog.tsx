'use client';

import { Edit } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { ListFormDialog, type ListFormValues } from '@/components/list-form-dialog';
import { Button } from '@/components/ui/button';
import { updateList } from '@/lib/lists';
import { getErrorMessage } from '@/lib/utils';

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

  async function handleSubmit(values: ListFormValues) {
    try {
      await updateList(listId, values.name, values.description, values.emoji);
      toast.success('List updated successfully');
      router.refresh();
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to update list'));
      return false;
    }
  }

  return (
    <ListFormDialog
      title="Edit List"
      description="Update your list details, emoji, and description."
      initialValues={{ name: listName, description: listDescription || '', emoji: listEmoji }}
      submitLabel="Update List"
      pendingLabel="Updating..."
      showCancel
      onSubmit={handleSubmit}
      trigger={
        children || (
          <Button variant="outline" size="sm">
            <Edit className="mr-2 h-4 w-4" />
            Edit List
          </Button>
        )
      }
    />
  );
}
