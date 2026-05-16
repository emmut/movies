import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';

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
import { addPasskey } from '@/lib/auth-client';

export function AddPasskey() {
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('My Passkey');
  const queryClient = useQueryClient();

  async function handleAddPasskey() {
    setIsLoading(true);

    if (name.trim() === '') {
      toast.error('Please enter a name for your passkey.');
      setIsLoading(false);
      return;
    }

    const { error } = await addPasskey(name.trim());

    if (error) {
      toast.error('Failed to add passkey. Please try again.');
    } else {
      toast.success('Passkey added successfully!');
      setIsOpen(false);
      setName('My Passkey');
      queryClient.invalidateQueries({ queryKey: ['passkeys'] });
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
