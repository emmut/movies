import type { CustomListSummary } from '@movies/api/custom-lists';
import { CustomListDelete } from '@native/components/custom-list-delete';
import { CustomListForm } from '@native/components/custom-list-form';

export function CustomListDialogs({
  userId,
  editor,
  deleting,
  closeEditor,
  closeDelete,
  deleted,
}: {
  userId: string;
  editor: CustomListSummary | 'create' | null;
  deleting: CustomListSummary | null;
  closeEditor: () => void;
  closeDelete: () => void;
  deleted?: () => void;
}) {
  const item = editor === 'create' ? undefined : (editor ?? undefined);
  const key = item?.id ?? 'create';
  return (
    <>
      {editor ? <CustomListForm key={key} userId={userId} item={item} close={closeEditor} /> : null}
      {deleting ? (
        <CustomListDelete item={deleting} userId={userId} close={closeDelete} deleted={deleted} />
      ) : null}
    </>
  );
}
