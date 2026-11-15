'use client';

import { PASSKEY_NAME_FORMS } from '@movies/api/passkeys';
import { Button } from '@movies/ui/components/button';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { addPasskey } from '@/lib/auth-client';
import { showPasskeyFailure } from '@/lib/passkey-feedback';

import { PasskeyNameDialog } from './passkey-name-dialog';

export function AddPasskey() {
  const router = useRouter();

  async function handleAddPasskey(name: string) {
    const result = await addPasskey(name);

    if (!result.ok) {
      showPasskeyFailure(result.reason, 'Failed to add passkey. Please try again.');
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
      form={PASSKEY_NAME_FORMS.add}
      onSubmit={handleAddPasskey}
    />
  );
}
