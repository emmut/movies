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
  return (
    <>
      {editor ? <ListEditor editor={editor} userId={userId} close={closeEditor} /> : null}
      {deleting ? (
        <CustomListDelete item={deleting} userId={userId} close={closeDelete} deleted={deleted} />
      ) : null}
    </>
  );
}

function ListEditor({
  editor,
  userId,
  close,
}: {
  editor: CustomListSummary | 'create';
  userId: string;
  close: () => void;
}) {
  if (editor === 'create') {
    return <CustomListForm key="create" userId={userId} close={close} />;
  }
  return <CustomListForm key={editor.id} userId={userId} item={editor} close={close} />;
}
