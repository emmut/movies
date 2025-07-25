'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { addPasskey } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

export function AddPasskey() {
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('My Passkey');
  const router = useRouter();

  async function handleAddPasskey() {
    setIsLoading(true);
    
    const { error } = await addPasskey(name.trim());
    
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
      <DialogTrigger asChild>
        <Button>Add Passkey</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Passkey</DialogTitle>
          <DialogDescription>
            Give your passkey a name to help you identify it later. This could be the device name or location.
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