'use client';

import { Button } from '@movies/ui/components/button';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { addPasskey } from '@/lib/auth-client';
import { passkeyFailureMessage } from '@/lib/passkey-errors';

import { PasskeyNameDialog } from './passkey-name-dialog';

export function AddPasskey() {
  const router = useRouter();

  async function handleAddPasskey(name: string) {
    const result = await addPasskey(name);

    if (!result.ok) {
      const message = passkeyFailureMessage(
        result.reason,
        'Failed to add passkey. Please try again.',
      );
      if (message) {
        toast.error(message);
      }
      return false;
    }

    toast.success('Passkey added successfully!');
    router.refresh();
    return true;
  }

  return (
    <PasskeyNameDialog
      trigger={<Button />}
      triggerLabel="Add Passkey"
      title="Add New Passkey"
      description="Give your passkey a name to help you identify it later. This could be the device name or location."
      initialName="My Passkey"
      submitLabel="Add Passkey"
      pendingLabel="Adding..."
      onSubmit={handleAddPasskey}
    />
  );
}
