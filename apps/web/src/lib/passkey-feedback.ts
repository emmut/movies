import { passkeyFailureMessage, type PasskeyFailure } from '@movies/api/passkeys';
import { toast } from 'sonner';

/** A dismissed prompt stays silent in every browser passkey entry point. */
export function showPasskeyFailure(reason: PasskeyFailure, fallback: string) {
  const message = passkeyFailureMessage(reason, fallback);
  if (message) {
    toast.error(message);
  }
}
