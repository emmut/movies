'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useState } from 'react';

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

      window.location.reload();
    } catch (error) {
      console.error('Failed to delete passkey:', error);
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
                  <div className="text-sm text-muted-foreground flex items-center gap-4">
                    <span className="capitalize">{passkey.deviceType}</span>
                    <span>
                      Created:{' '}
                      {passkey.createdAt
                        ? new Date(passkey.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : 'Unknown'}
                    </span>
                  </div>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeletePasskey(passkey.id)}
                  disabled={deletingIds.has(passkey.id)}
                >
                  {deletingIds.has(passkey.id) ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </CardContent>
          </Card>
          {index < passkeys.length - 1 && <Separator />}
        </div>
      ))}
    </div>
  );
}