'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

type Passkey = {
  id: string;
  name?: string;
  createdAt?: Date;
  deviceType: string;
};

type PasskeyListProps = {
  passkeys: Passkey[];
};

export function PasskeyList({ passkeys }: PasskeyListProps) {
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<string | null>(null);
  const router = useRouter();

  async function handleDeletePasskey(passkeyId: string) {
    setDeletingIds((prev) => new Set([...prev, passkeyId]));

    try {
      const response = await fetch('/api/auth/passkey/delete-passkey', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: passkeyId }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete passkey');
      }

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
      <p className="text-muted-foreground text-sm">
        No passkeys found. Add your first passkey to get started.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {passkeys.map((passkey, index) => (
        <div key={passkey.id}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="font-medium">
                    {passkey.name || 'Unnamed passkey'}
                  </div>
                  <div className="text-muted-foreground flex items-center gap-4 text-sm">
                    <span className="capitalize">{passkey.deviceType}</span>
                    <span>
                      Created:{' '}
                      {passkey.createdAt
                        ? new Date(passkey.createdAt).toLocaleDateString(
                            'en-GB',
                            {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            }
                          )
                        : 'Unknown'}
                    </span>
                  </div>
                </div>

                <Dialog
                  open={deleteDialogOpen === passkey.id}
                  onOpenChange={(open) =>
                    setDeleteDialogOpen(open ? passkey.id : null)
                  }
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={deletingIds.has(passkey.id)}
                    >
                      {deletingIds.has(passkey.id) ? 'Deleting...' : 'Delete'}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete Passkey</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to delete &quot;
                        {passkey.name || 'Unnamed passkey'}&quot;? This action
                        cannot be undone and you will no longer be able to use
                        this passkey to sign in.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setDeleteDialogOpen(null)}
                        disabled={deletingIds.has(passkey.id)}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleDeletePasskey(passkey.id)}
                        disabled={deletingIds.has(passkey.id)}
                      >
                        {deletingIds.has(passkey.id)
                          ? 'Deleting...'
                          : 'Delete Passkey'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
          {index < passkeys.length - 1 && <Separator />}
        </div>
      ))}
    </div>
  );
}
