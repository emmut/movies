'use client';

import { Button } from '@/components/ui/button';
import { addPasskey } from '@/lib/auth-client';
import { useState } from 'react';

export function AddPasskey() {
  const [isLoading, setIsLoading] = useState(false);

  async function handleAddPasskey() {
    setIsLoading(true);
    try {
      await addPasskey();
      window.location.reload();
    } catch (error) {
      console.error('Failed to add passkey:', error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button onClick={handleAddPasskey} disabled={isLoading}>
      {isLoading ? 'Adding...' : 'Add Passkey'}
    </Button>
  );
}