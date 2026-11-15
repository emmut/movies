'use client';

import {
  PASSKEY_NAME_FORMS,
  deviceTypeLabel,
  formatPasskeyDate,
  type PasskeyMetadata,
} from '@movies/api/passkeys';
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
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { deletePasskey, renamePasskey } from '@/lib/auth-client';

import { PasskeyNameDialog } from './passkey-name-dialog';

const UNNAMED = 'Unnamed passkey';

export function PasskeyList({ passkeys }: { passkeys: PasskeyMetadata[] }) {
  if (passkeys.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No passkeys found. Add your first passkey to get started.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {passkeys.map((passkey) => (
        <li key={passkey.id}>
          <PasskeyItem passkey={passkey} />
        </li>
      ))}
    </ul>
  );
}

function PasskeyItem({ passkey }: { passkey: PasskeyMetadata }) {
  const router = useRouter();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const displayName = passkey.name || UNNAMED;

  async function handleRename(name: string) {
    const result = await renamePasskey(passkey.id, name);

    if (!result.ok) {
      toast.error('Failed to rename passkey. Please try again.');
      return false;
    }

    toast.success('Passkey renamed.');
    router.refresh();
    return true;
  }

  async function handleDelete() {
    setIsDeleting(true);
    const result = await deletePasskey(passkey.id);
    setIsDeleting(false);

    if (!result.ok) {
      toast.error('Failed to delete passkey. Please try again.');
      return;
    }

    toast.success('Passkey deleted successfully!');
    setIsDeleteOpen(false);
    router.refresh();
  }

  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 p-4">
        <div className="space-y-1">
          <div className="font-medium">{displayName}</div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{deviceTypeLabel(passkey.deviceType)}</span>
            <span>Created: {formatPasskeyDate(passkey.createdAt)}</span>
          </div>
        </div>

        <div className="flex shrink-0 gap-2">
          <PasskeyNameDialog
            trigger={<Button variant="outline" size="sm" disabled={isDeleting} />}
            triggerLabel="Rename"
            form={PASSKEY_NAME_FORMS.rename}
            initialName={passkey.name ?? ''}
            onSubmit={handleRename}
          />

          <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
            <DialogTrigger
              render={<Button variant="destructive" size="sm" disabled={isDeleting} />}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Passkey</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete &quot;{displayName}&quot;? This action cannot be
                  undone and you will no longer be able to use this passkey to sign in.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDeleteOpen(false)}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                  {isDeleting ? 'Deleting...' : 'Delete Passkey'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}
