'use client';

import { formatPasskeyDate, type PasskeyMetadata } from '@movies/api/passkeys';
import { Button } from '@movies/ui/components/button';
import { Card, CardContent } from '@movies/ui/components/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@movies/ui/components/dialog';
import { Separator } from '@movies/ui/components/separator';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { useDeletePasskeyMutation } from '@/hooks/use-passkey-mutations';

type PasskeyListProps = {
  passkeys: PasskeyMetadata[];
};

export function PasskeyList({ passkeys }: PasskeyListProps) {
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<string | null>(null);
  const router = useRouter();
  const remove = useDeletePasskeyMutation();

  async function handleDeletePasskey(passkeyId: string) {
    setDeletingIds((prev) => new Set([...prev, passkeyId]));

    try {
      await remove.mutateAsync(passkeyId);

      toast.success('Passkey deleted successfully!');
      setDeleteDialogOpen(null);
      router.refresh();
    } catch (error) {
      console.error('Failed to delete passkey:', error);
      toast.error('Failed to delete passkey. Please try again.');
    } finally {
      setDeletingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(passkeyId);
        return newSet;
      });
    }
  }

  if (passkeys.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No passkeys found. Add your first passkey to get started.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {passkeys.map((passkey, index) => (
        <div key={passkey.id}>
          <PasskeyRow
            passkey={passkey}
            deleting={deletingIds.has(passkey.id)}
            open={deleteDialogOpen === passkey.id}
            setOpen={(open) => setDeleteDialogOpen(open ? passkey.id : null)}
            remove={() => handleDeletePasskey(passkey.id)}
          />
          {index < passkeys.length - 1 && <Separator />}
        </div>
      ))}
    </div>
  );
}

function PasskeyRow({
  passkey,
  deleting,
  open,
  setOpen,
  remove,
}: {
  passkey: PasskeyMetadata;
  deleting: boolean;
  open: boolean;
  setOpen: (open: boolean) => void;
  remove: () => void;
}) {
  const name = passkey.name || 'Unnamed passkey';
  const deleteLabel = deleting ? 'Deleting...' : 'Delete';
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="font-medium">{name}</div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="capitalize">{passkey.deviceType}</span>
              <span>Created: {formatPasskeyDate(passkey.createdAt)}</span>
            </div>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button variant="destructive" size="sm" disabled={deleting} />}>
              {deleteLabel}
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Passkey</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete &quot;
                  {name}&quot;? This action cannot be undone and you will no longer be able to use
                  this passkey to sign in.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)} disabled={deleting}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={remove} disabled={deleting}>
                  {deleting ? 'Deleting...' : 'Delete Passkey'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}
