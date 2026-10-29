'use client';

import { passkeyNameSchema } from '@movies/api/passkeys';
import { Button } from '@movies/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@movies/ui/components/dialog';
import { Input } from '@movies/ui/components/input';
import { Label } from '@movies/ui/components/label';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { addPasskey } from '@/lib/auth-client';

export function AddPasskey() {
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('My Passkey');
  const router = useRouter();

  async function handleAddPasskey() {
    setIsLoading(true);

    // Validate that the passkey name is not empty
    const parsed = passkeyNameSchema.safeParse(name);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      setIsLoading(false);
      return;
    }

    const { error } = await addPasskey(parsed.data);

    if (error) {
      toast.error('Failed to add passkey. Please try again.');
    } else {
      toast.success('Passkey added successfully!');
      setIsOpen(false);
      setName('My Passkey');
      router.refresh();
    }

    setIsLoading(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger render={<Button />}>Add Passkey</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Passkey</DialogTitle>
          <DialogDescription>
            Give your passkey a name to help you identify it later. This could be the device name or
            location.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="passkey-name">Passkey Name</Label>
            <Input
              id="passkey-name"
              placeholder="e.g., MacBook Pro, iPhone, YubiKey"
              value={name}
              maxLength={100}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setIsOpen(false);
              setName('My Passkey');
            }}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleAddPasskey} disabled={isLoading}>
            {isLoading ? 'Adding...' : 'Add Passkey'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
